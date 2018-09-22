const ConsoleLogger = require('./Logger/ConsoleLogger');
const Subscription = require('./Publishers/Subscription');
const Sender = require('./MessageHandlers/Sender');
const UserRegistrar = require('./Users/UserRegistrar');
const PairRequestHandler = require('./Users/PairRequestHandler');
const User = require('../Models/User');
const SubscriptionEnum = new (require('./Publishers/SubscriptionsEnum'))();

class Dispatcher {
  constructor() {
    this.dispatchedClientPublishers = {
      subscriptions: {}
    };
    this.connections = [];
  }

  addOnCloseUnsubscribe(ws, message) {
    ws.addEventListener('close', () => {
      // Here we fake an incoming unsubscribe message

      const finalSubscriptions = {};

      for( let id in this.dispatchedClientPublishers.subscriptions ) {
        if(this.dispatchedClientPublishers.subscriptions.hasOwnProperty(id) && id !== message.id) {
          finalSubscriptions[id] = this.dispatchedClientPublishers.subscriptions[id];
        } else {
          this.dispatchedClientPublishers.subscriptions[id].unsubscribe({
            ...message,
            type: 'unsubscribe'
          });
        }
      }

      this.dispatchedClientPublishers.subscriptions = finalSubscriptions;
    });
  }

  handlePairRequest(websocket, message) {
    const pairRequestHandler = new PairRequestHandler(websocket, message, this.onlineUsers);
    pairRequestHandler.run(this.dispatchedClientPublishers.subscriptions);
  }

  removeConnection(ws) {
    const connection = this.connections.find(c => c.ws === ws);
    this.alertUnRegisterSubscribers(connection.user);
    this.connections = this.connections.filter(s => s.ws !== ws);
  }

  alertUnRegisterSubscribers(id) {
    Object.values(this.dispatchedClientPublishers.subscriptions).forEach(subscription => {
      if(typeof subscription === 'undefined' || typeof subscription.conf === 'undefined') return;

      if(subscription.conf.subscriptions.includes(SubscriptionEnum.user_leave)) {
        subscription.subscriptionProviders.forEach(provider => {
          if(provider.getSubscriptionId() === SubscriptionEnum.user_leave && provider.running) {
            User.findById(id).then(user => {
              if(user) {
                provider.onUserLeave(user.username, user.id, user.details())
                user.destroy();
              }
            })
          }
        });
      }
    });
  }

  start(ws, message) {
    ConsoleLogger.log(`Accepted new event from client ${message.id}.`);
    ConsoleLogger.log(message);

    switch (message.type) {
      case 'subscribe':
        this.dispatchedClientPublishers.subscriptions[message.id] = (new Subscription(ws, message)).run();
        // Also add an unsubscribe handler to this websocket for when it disconnects
        this.addOnCloseUnsubscribe(ws, message);
        break;
      case 'unsubscribe':
        this.dispatchedClientPublishers.subscriptions[message.id].unsubscribe(message);
        break;
      case 'message-send':
        this.dispatchedClientPublishers.subscriptions[message.id] = (new Sender(ws, message, this.dispatchedClientPublishers.subscriptions)).run();
        break;
      case 'register':
        User.create({
          id: message.id,
          username: message.username,
          about: message.details.userAbout
        });
        this.connections.push({
          ws: ws,
          user: message.id
        })
        ws.send(JSON.stringify({
          type: 'registered',
          id: message.id,
          status: `Successfully registered user ${message.username}`
        }, null, 2));
        //this.addDeRegisterOnClose(ws, message.username);
        break;
      case 'pair-request':
        this.handlePairRequest(ws, message);
        break;
      default:
        throw new Error("Message received from client which doesn't conform to the defined types.");
    }
  }
}

module.exports = Dispatcher;