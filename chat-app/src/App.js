import React from 'react';
import { createStore, combineReducers } from 'redux';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { connect, Provider} from 'react-redux';



const reducer = combineReducers({
    activeThreadId: activeThreadIdReducer,
    threads: threadsReducer
})

function activeThreadIdReducer(state = '1-fca2', action) {
  if (action.type === 'OPEN_THREAD') {
    return action.id;
  } else {
    return state;
  }
}

function threadsReducer(state = [
  {
    id: '1-fca2',
    title: 'Buzz Aldrin',
    messages: messagesReducer(undefined, {}),
  },
  {
    id: '2-be91',
    title: 'Michael Collins',
    messages: messagesReducer(undefined, {}),
  },
], action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
    case 'DELETE_MESSAGE': {
      const threadIndex = findThreadIndex(state, action);

      const oldThread = state[threadIndex];
      const newThread = {
        ...oldThread,
        messages: messagesReducer(oldThread.messages, action),
      };

      return [
        ...state.slice(0, threadIndex),
        newThread,
        ...state.slice(
          threadIndex + 1, state.length
        ),
      ];
    } default: {
      return state
    }
  }
}

function findThreadIndex(threads, action) {
    switch (action.type) {
      case 'ADD_MESSAGE': {
        return threads.findIndex(
          (t) => t.id === action.threadId
        );
      }
      case 'DELETE_MESSAGE': {
        return threads.findIndex(
          (t) => t.messages.find((m) => (
            m.id === action.id
          ))
        );
      }
      default: {
        return threads
      }
    }
}

function messagesReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_MESSAGE': {
      const newMessage = {
        text: action.text,
        timestamp: moment().format('MMMM Do YYYY, h:mm:ss a'),
        id: uuidv4()
      }

      return state.concat(newMessage);
    }
    case 'DELETE_MESSAGE': {
      return state.filter(m => m.id !== action.id);
    }
    default: {
      return state
    }
  }
}


const store = createStore(reducer);

function deleteMessage(id) {
  return {
    type: 'DELETE_MESSAGE',
    id: id
  }
}

function addMessage(text, threadId) {
  return {
    type: 'ADD_MESSAGE',
    text: text,
    threadId: threadId
  }
}

function openThread(id) {
  return {
    type: 'OPEN_THREAD',
    id: id
  }
}

const App = () => (
      <div className='main'>
        <ThreadTabs/>
        <ThreadDisplay/>
      </div>
);

const WrappedApp = () => (
  <Provider store={store}>
    <App/>
  </Provider>
)
 

const mapDispatchToTabsProps = (dispatch) => (
  {
    onClickTab: (id) => (
      dispatch(openThread(id))
    )
  }
)

const mapsStateToTabsProps = (state) => {
  const tabs = state.threads.map(t => (
    {
      title: t.title,
      active: t.id === state.activeThreadId,
      id: t.id
    }
  ))
  const other_thread = state.threads.find(t => t.id !== state.activeThreadId);
  const m_count = other_thread.messages.length
  return {
    tabs: tabs,
    m_count: m_count
  }
}


const Tabs = (props) => (
  <div className='items'>
    {
      props.tabs.map((tab, index) => (
        <div 
          key={index}
          className={tab.active ? 'active-item' : 'item'}
          onClick={() => props.onClickTab(tab.id)} 
          data-count={props.m_count}
      >
        {tab.title}
      </div>
      ))
    }
  </div>
)


const ThreadTabs = connect(
  mapsStateToTabsProps,
  mapDispatchToTabsProps
)(Tabs);


const mapStateToThreadProps = (state) => (
  {
    thread: state.threads.find(
      (t) => t.id === state.activeThreadId
    ),
    other_thread: state.threads.find(
      (t) => t.id !== state.activeThreadId
    ),
  }
)

const mapDispatchThreadProps = (dispatch) => (
  {
    onMessageClick: (id) =>(
      dispatch(deleteMessage(id))
    ),
    dispatch: dispatch
  }
)

const mergeThreadProps = (stateProps, dispatchProps) => (
  {
    ...stateProps,
    ...dispatchProps,
    onMessageSubmit: (text) => (
      dispatchProps.dispatch(addMessage(text, stateProps.thread.id))
    ),
    all_messages: arrangeMessageList(stateProps)
  }
)

const arrangeMessageList = (state) => {
  const own_message = state.thread.messages;
  const other_message = state.other_thread.messages;
  const all_messages = [];

  for (var i = 0; i < own_message.length; ++i) {
    if (own_message.length) {
      all_messages.push(own_message[i]);
    }
    if (other_message.length) {
      all_messages.push(other_message);
    }
  }
  console.log(all_messages)
}

const Thread = (props) => (
  <div className='messages'>
    <MessageList
      onClick={props.onMessageClick}
      messages={props.thread.messages}
      other_messages={props.other_thread.messages}
      all_messages={props.all_messages}
    />
    <TextFieldSubmit
      onSubmitText={props.onMessageSubmit}
    />
  </div>
)

const MessageList = (props) => (
  <div className='ind-messages'>
    {
      props.other_messages.map((m, index) => (
        <div
          className='other_message'
          key={index}
        >{m.text}</div>
      ))
    }
    {
      props.messages.map((m, index) => (
        <div
        className='message'
          key={index}
          onClick={() => props.onClick(m.id)}>
            {m.text}
            <span className='date'>@{m.timestamp}</span>
        </div>
      ))
    }
  </div>
)

const ThreadDisplay = connect(
  mapStateToThreadProps,
  mapDispatchThreadProps,
  mergeThreadProps
)(Thread);


class TextFieldSubmit extends React.Component {
  state = {
    value: '',
  };

  onChange = (e) => {
    this.setState({
      value: e.target.value,
    })
  };

  handleSubmit = () => {
    this.props.onSubmitText(this.state.value)
    this.setState({
      value: '',
    });
  };

  render() {
    return (
      <div className='input'>
        <input
          onChange={this.onChange}
          value={this.state.value}
          type='text'
        />
        <button
          onClick={this.handleSubmit}
          className='button'
          type='submit'
        >
          Submit
        </button>
       </div>
    );
  }
}

export default WrappedApp;
