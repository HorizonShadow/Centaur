const SubscriptionEnum = new (require('../Publishers/SubscriptionsEnum'))();
const User = require('../../Models/User');

class PairRequestHandler {
  constructor(websocket, message, users) {
    this.message = message;
    this.users = users;
    this.websocket = websocket;
    this.subscriptions = {};
  }

  check() {
    return Object.keys(this.users).includes(this.message.code);
  }

  sendResponse(response) {
    this.websocket.send(JSON.stringify({
      ...response,
      id: this.message.id
    }, null, 2));
  }

  startConversationForPair() {
    Object.values(this.subscriptions).forEach(subscription => {
      if(typeof subscription === 'undefined' || typeof subscription.conf === 'undefined') return;

      if(subscription.conf.subscriptions.includes(SubscriptionEnum.conversation_start)) {
        subscription.subscriptionProviders.forEach(provider => {
          if(provider.getSubscriptionId() === SubscriptionEnum.conversation_start && provider.running) {
            User.findById(this.message.myJoinCode).then(user => {
              provider.onNewConversation(this.message.myJoinCode, this.message.code, user);
            })
            
          }
        });
      }
    });
  }

  run(subscriptions) {
    this.subscriptions = subscriptions;
    User.findById(this.message.code).then(user => {
      if(user) {
        this.sendResponse({
          type: 'pair-response',
          status: 'Successfully paired!',
          success: true,
          user: user.getSerializeableObject()
        });
        this.startConversationForPair();
      } else {
        this.sendResponse({
          type: 'pair-response',
          status: 'No user(s) exist with that join code. Invalid join code.',
          success: false
        });
      }
    });
  }
}

module.exports = PairRequestHandler;