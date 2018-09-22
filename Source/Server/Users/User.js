const SubscriptionEnum = new (require('../Publishers/SubscriptionsEnum'))();

class User {
  constructor(username, details, subscriptions, initMessage) {
    this.username = username;
    this.details = details;
    console.log(details);
    this.subscriptions = subscriptions;
    this.initMessage = initMessage;
  }

  unregister() {
    this.alertUnRegisterSubscribers();
  }

  getSerializeableObject() {
    return {
      details: this.details,
      username: this.username
    };
  }
}

module.exports = User;