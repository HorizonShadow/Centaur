import React, { Component } from 'react';
import "../Styles/CentaurBase.scss";
import MuiThemeProvider from "@material-ui/core/es/styles/MuiThemeProvider";
import {MaterialTheme} from "./Themes/MaterialTheme";
import Navbar from "./Components/Navigation/Navbar";
import ContextPageHandler from "./Components/ContextPage/ContextPageHandler";
import {Subscriber} from "./Functional/Subscriber";
import {SubscriptionsEnum} from "./Configuration/SubscriptionsEnum";
import Register from "./Components/Register/Register";
import {Registrar} from "./Functional/Registrar";
import ChatStore from "./Components/ChatApp/Chat/ChatStore";
import {SnackbarNotify} from "./Components/Notification/SnackbarNotify";

export default class AppMount extends Component {
  state = {
    // possible values are 'chat', 'profile', 'settings'
    context: 'chat',
    appStarted: false,
    activeUsername: null,
    userAbout: null,
    joinCode: null,
    showNotification: false,
    notificationMessage: null,
    notificationActions: []
  };

  static WS_URI = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

  /**
   * @type {WebSocket}
   */
  webSocket = null;

  /**
   * @type {Subscriber}
   */
  subscriber = null;

  constructor(props) {
    super(props);

    this.webSocket = new WebSocket(AppMount.WS_URI);
    this.webSocket.addEventListener('open', (ev) => this.startApp(ev));

    this.subscriber = new Subscriber(this.webSocket);
  }

  startApp(ev) {
    this.setState({
      appStarted: true
    });

    this.initialSubscribe(ev);
  }

  serverStateMutationHandler(data) {
    console.log(data);
  }

  initialSubscribe(event) {
    // Initially we would like to subscribe to state changes.
    this.subscriber.subscribe([SubscriptionsEnum.server_state], (data) => this.serverStateMutationHandler(data));
  }

  registerUser(data) {
    const registrar = new Registrar(this.webSocket, data.username, {
      userAbout: data.about
    });

    registrar.register(() => {
      this.setState({
        activeUsername: data.username,
        userAbout: data.about,
        joinCode: registrar.id
      });
    });
  }

  changeContext = context => this.setState({
    context
  });

  showNotification(message, action) {
    this.setState({
      showNotification: true,
      notificationMessage: message,
      notificationActions: action
    });
  }

  closeNotification() {
    this.setState({
      showNotification: false,
      notificationMessage: '',
      notificationActions: []
    });
  }

  render() {
    return (
      <MuiThemeProvider theme={MaterialTheme}>
        {this.state.appStarted
          ? (
            this.state.activeUsername
              ? (
                <React.Fragment>
                  <SnackbarNotify
                    open={this.state.showNotification}
                    onClose={() => this.closeNotification()}
                    message={this.state.notificationMessage}
                    actions={this.state.notificationActions}
                  />
                  <main className="content-space">
                    <ChatStore>
                      <ContextPageHandler
                        context={this.state.context}
                        websocket={this.webSocket}
                        activeUsername={this.state.activeUsername}
                        activeUserAbout={this.state.userAbout}
                        joinCode={this.state.joinCode}
                        showNotification={(message, actions = []) => this.showNotification(message, actions)}
                        closeNotification={() => this.closeNotification()}
                      />
                    </ChatStore>
                  </main>
                  <footer className="nav-space">
                    <Navbar onChange={this.changeContext} />
                  </footer>
                </React.Fragment>
              )
              : <Register onRegister={(data) => this.registerUser(data)} />
          ): (<div>starting</div>)}
      </MuiThemeProvider>
    );
  }
}