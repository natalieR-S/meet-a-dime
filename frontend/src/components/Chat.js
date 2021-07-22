import React, { useState, useEffect, useRef } from 'react';
import {
  Navbar,
  Container,
  Form,
  Modal,
  Button,
  InputGroup,
  Row,
  Col,
  FormControl,
} from 'react-bootstrap';
import '../styles/fontawesome-free-5.15.3-web/css/all.css';
import ReactRoundedImage from 'react-rounded-image';
import Grid from '@material-ui/core/Grid';
import { useAuth } from '../contexts/AuthContext';
import { useHistory, useLocation } from 'react-router-dom';
import { Alert } from '@material-ui/lab';
import { io } from 'socket.io-client';
import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import moment from 'moment';
import Zoom from '@material-ui/core/Zoom';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import LinearProgress from '@material-ui/core/LinearProgress';
import imageCompression from 'browser-image-compression';
import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HomeIcon from '@material-ui/icons/Home';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import ReportIcon from '@material-ui/icons/Report';
import ErrorIcon from '@material-ui/icons/Error';
import AddPhotoAlternateIcon from '@material-ui/icons/AddPhotoAlternate';
import SendIcon from '@material-ui/icons/Send';
import CircularProgress from '@material-ui/core/CircularProgress';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';

var bp = require('../Path.js');
const firestore = firebase.firestore();
const EXPIRE_IN_MINUTES = 0.4; // 10 minutes
const MESSAGE_IMAGE_WIDTH = 250; // just a const for easy changing.
const modalExpire = 10000; // 30 seconds in MS

// Drawer
const drawerWidth = 300;
// Users sending messages
var isSentByCurrentUser = false;
const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
  title: {
    flexGrow: 1,
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
    background: '#FFDCF2',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-start',
  },
  listItemText: {
    fontSize: '25px',

    color: '#E64398',
  },
  listItemReportText: {
    fontSize: '25px',
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    // marginRight: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
}));

export default function Chat() {
  // Drawer
  const classes = useStyles();
  const itemsList = useRef([
    {
      text: 'Home',
      tooltip: 'This will abandon your match!',
      icon: <HomeIcon style={{ color: '#e64398' }} />,
      onClick: redirectToHome,
    },

    {
      text: 'Logout',
      tooltip: 'This will abandon your match!',
      icon: <ExitToAppIcon style={{ color: '#e64398' }} />,
      onClick: handleLogout,
    },
    {
      text: 'Report Chat',
      tooltip: 'Privately report the other user.',
      icon: <ReportIcon style={{ color: 'white' }} />,
      // onClick: handleReport,
      onClick: () => {
        doubleCheck(handleReport, 'report');
      },
    },
  ]);

  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  // const [modalOpen, setModalOpen] = React.useState(false);

  // const handleModalOpen = () => {
  //   setModalOpen(true);
  // };

  // const handleModalClose = () => {
  //   setModalOpen(false);
  // };

  const [switching, setSwitching] = useState(false);

  const messageRef = useRef();
  const photoButtonRef = useRef();
  const photoAttachRef = useRef();
  const [noPhoto, setNoPhoto] = useState(true);
  const [photoName, setPhotoName] = useState('');
  const [sendingPhoto, setSendingPhoto] = useState(false);
  const timeoutRef1 = useRef();
  const timeoutRef2 = useRef();
  const extendedTimeoutRef = useRef();
  const socketRef = useRef();
  const roomRef = useRef();

  const [room, setRoom] = useState('');
  //const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [socket, setSocket] = useState();
  const [afterChat, setAfterChat] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const refAfterChat = useRef(false);
  // const [isHost, setHost] = useState('none');
  const { currentUser, logout } = useAuth();

  const [match_age, setMatchAge] = useState('');
  const [match_name, setMatchName] = useState('user');
  const [bothInitialized, setBothInitialized] = useState(false);
  const [match_sex, setMatchSex] = useState('');
  const [match_photo, setMatchPhoto] = useState('');
  const [match_initialized, setMatchInitialized] = useState(-1);
  const [match_responses, setMatchResponses] = useState([]);

  const [my_photo, setMyPhoto] = useState('');
  const [user_initialized, setUserInitialized] = useState(-1);

  const question1 = 'What do you like to do for fun or to relax?';
  const question2 = 'What do you do for a living?';
  const question3 = 'Would you say you are a romantic?';
  const question4 = 'Are you an optimist or a pessimist?';
  const question5 = 'What are you most passionate about?';
  const question6 = "Do you like horoscopes? If so, what's your sign?";
  const question7 = 'What does an ideal date look like in your eyes?';
  const question8 = 'What does your ideal future look like?';
  const question9 = 'What is your favorite type of music?';
  const question10 = 'Do you have any pets? If you do, tell me about them!';
  const question11 = 'Do you have any sibilings? If so, how many?';
  const question12 = 'What is your favorite game to play?';
  const questions = [
    question1,
    question2,
    question3,
    question4,
    question5,
    question6,
    question7,
    question8,
    question9,
    question10,
    question11,
    question12,
  ];
  const question_emojis = [
    '🌴',
    '💸',
    '😘',
    '😄',
    '🎺',
    '♑',
    '🥰',
    '🔮',
    '🎵',
    '🐾',
    '👨‍👨‍👦‍👦',
    '🎮',
  ];

  const [isOffline, setIsOffline] = useState(false);

  const matchPhotoRef = useRef('');
  const myPhotoRef = useRef('');
  // console.log(socket);
  useLocation();
  // Gets the passed in match id from the link in the home page
  // timeout_5 is passed in from the home link. it prevents removing the match document in the background.

  const history = useHistory();
  const observer = useRef(null);

  // if (location.state === undefined) window.location.href = '/';

  // const { match_id, timeout_5 } = location.state;

  var match_id = null;
  var timeout_5 = null;

  var verifyFail = false;

  // In case the user navigates here directly by accident.
  if (
    history.location &&
    history.location.state &&
    history.location.state.state &&
    history.location.state.state.match_id
  ) {
    match_id = history.location.state.state.match_id;
    timeout_5 = history.location.state.state.timeout_5;
  } else {
    console.log('DOESNT BELONG');
    if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
    if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);
    // window.location.href = '/';
  }

  document.getElementById('room-button');
  document.getElementById('message_input');
  document.getElementById('room-input');
  document.getElementById('form');

  // var localStorageKey = 1701;
  const localStorageKey = useRef(1701);

  // Redirect users if they are not verified.
  if (!currentUser.emailVerified) {
    history.push('/verify');
  }

  // Fetch the matches' name, birth, sex when page loads.
  async function fetchMatchInfo() {
    try {
      const token = currentUser && (await currentUser.getIdToken());
      var config = {
        method: 'post',
        url: bp.buildPath('api/getbasicuser'),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: { uid: match_id },
      };
      var response = await axios(config);
      // console.log(response.data);
      console.log('fetched data!');
      setMatchAge(moment().diff(response.data.birth, 'years'));
      setMatchName(response.data.firstName);
      setMatchSex(response.data.sex);
      setMatchPhoto(response.data.photo);
      setMatchInitialized(response.data.initializedProfile);
      matchPhotoRef.current = response.data.photo;
      var my_profile_pic = JSON.parse(localStorage.getItem('user_data')).photo;
      var my_initialized = JSON.parse(
        localStorage.getItem('user_data')
      ).initializedProfile;

      // console.log(my_initialized);
      // console.log(response.data.initializedProfile);
      if (my_initialized === 1 && response.data.initializedProfile === 1) {
        setBothInitialized(true);
        setMatchResponses(response.data.answers);
        // console.log(response.data.answers);
        var temp = [];
        temp.push(itemsList.current[0]);
        temp.push({
          text: 'Match Q & A',
          tooltip: 'See what the other user answered to the random question!',
          icon: <QuestionAnswerIcon style={{ color: '#e64398' }} />,
          onClick: () => {
            handleRandomQuestion(
              response.data.firstName,
              response.data.answers
            );
          },
        });
        temp.push(itemsList.current[1]);

        temp.push(itemsList.current[2]);
        itemsList.current = temp;
      }
      myPhotoRef.current = my_profile_pic;
    } catch (error) {
      console.log(error);
    }
  }

  async function checkSearchingDoc(socketInstance) {
    // console.log('Checking searching doc');
    var myDoc = await firestore
      .collection('searching')
      .doc(currentUser.uid)
      .get();
    if (myDoc.exists && myDoc.data().match !== '') return true;
    else {
      var matchDoc = await firestore
        .collection('searching')
        .doc(match_id)
        .get();
      if (matchDoc.exists && matchDoc.data().match !== '') return true;
      else {
        // Doc doesnt exists..
        localStorage.removeItem('inActiveChat');
        localStorage.removeItem('activeSocket');
        socketInstance.emit('leave-room-silently', currentUser.uid, room);
        if (timeoutRef1.current !== undefined)
          clearTimeout(timeoutRef1.current);
        if (timeoutRef2.current !== undefined)
          clearTimeout(timeoutRef2.current);
        if (extendedTimeoutRef.current !== undefined)
          clearTimeout(extendedTimeoutRef.current);
        clearChatData();
        console.log('pushing to after');
        history.push('/after', {
          state: { match_id: match_id, type: 'error' },
        });
      }
    }
  }

  function noMatch() {
    if (verifyFail == true) {
      if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
      if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);
      clearChatData();

      setTimeout(async () => {
        await firestore
          .collection('users')
          .doc(currentUser.uid)
          .update({
            FailMatch: firebase.firestore.FieldValue.arrayUnion(match_id),
          });
        await firestore
          .collection('users')
          .doc(match_id)
          .update({
            FailMatch: firebase.firestore.FieldValue.arrayUnion(
              currentUser.uid
            ),
          });
        socket.emit('leave-room', currentUser.uid, room);
        console.log('LEFT MY ROOM TOO');

        history.push('/after', {
          state: { match_id: match_id, type: 'user_didnt_go_well' },
        });
      }, 0);
    } else {
      verifyFail = true;
      ShowHide('initialModal');
      ShowHide('verifyFailMessage');
    }
  }

  async function noMatchTimeout() {
    if (window.location.pathname !== '/chat') {
      console.log('tried to run no match timeout, but was not on chat page.');
      return;
    }
    var seeker = 'none';
    var match = 'none';
    clearChatData();

    try {
      var docRef = firestore.collection('searching').doc(currentUser.uid);
      var doc = await docRef.get();
      if (doc.exists) {
        seeker = currentUser.uid;
        match = match_id;
      } else {
        seeker = match_id;
        match = currentUser.uid;
      }

      if (currentUser.uid === seeker) {
        await firestore.collection('searching').doc(currentUser.uid).update({
          seekerTail: 'timeout',
        });
        console.log('I am the seeker, I set my value TIMEOUT.');
      }

      if (currentUser.uid === match) {
        await firestore.collection('searching').doc(match_id).update({
          matchTail: 'timeout',
        });
        console.log('I am the match, I set my value TIMEOUT.');
      }
    } catch (error) {
      console.log(error);
    }

    socketRef.current.emit('leave-room-silently', currentUser.uid, room);

    history.push('/after', {
      state: { match_id: match_id, type: 'timeout' },
    });

    console.log('Left room silently');
  }

  function ShowHide(divId) {
    if (document.getElementById(divId).style.display == 'none') {
      document.getElementById(divId).style.display = 'block';
    } else {
      document.getElementById(divId).style.display = 'none';
    }
  }

  async function pendingMatch() {
    // hide & show images
    //document.getElementById('heartEyesImage').style.display = 'none';
    //document.getElementById('sleepyImage').style.display = 'none';
    ShowHide('heartEyesImage');
    ShowHide('sleepyImage');
    if ((document.getElementById('initialModal').style.display = 'block'))
      ShowHide('initialModal');
    if ((document.getElementById('verifyFailMessage').style.display = 'block'))
      ShowHide('verifyFailMessage');
    ShowHide('waitingForMatch');
    ShowHide('coinWaiting');

    // This disconnects then sends to the /after page with a state.
    function leavePageWith(stateString) {
      socketRef.current.emit('leave-room-silently', currentUser.uid, room);
      history.push('/after', {
        state: { match_id: match_id, type: stateString },
      });
    }
    // This sets both eachothe to success matches, if we get actually get there.
    async function setSuccessMatches() {
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({
          SuccessMatch: firebase.firestore.FieldValue.arrayUnion(match_id),
        });
      await firestore
        .collection('users')
        .doc(match_id)
        .update({
          SuccessMatch: firebase.firestore.FieldValue.arrayUnion(
            currentUser.uid
          ),
        });
    }

    // If a user clicks a match dime, stop the timeouts.
    if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
    if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);

    // This extended timeout waits for an answer.
    var extended_timeout = setTimeout(() => {
      socketRef.current.emit('leave-room-silently', currentUser.uid, room);
      clearChatData();
      if (observer.current !== null) observer.current();
      history.push('/after', {
        state: { match_id: match_id, type: 'extended_timeout' },
      });
    }, modalExpire);

    // Save in ref incase a regular abandon occurs.
    extendedTimeoutRef.current = extended_timeout;

    // Identify who is who.
    var seeker = 'none';
    var match = 'none';

    // There is only one doc. If I am the doc name, I am seeker. else, match
    var docRef = firestore.collection('searching').doc(currentUser.uid);
    var doc = await docRef.get();
    if (doc.exists) {
      seeker = currentUser.uid;
      match = match_id;
    } else {
      seeker = match_id;
      match = currentUser.uid;
    }

    // If im seeker, I need to set my value to true and wait for matchTail.
    if (currentUser.uid === seeker) {
      await firestore.collection('searching').doc(currentUser.uid).update({
        seekerTail: 'true',
      });
      console.log('I am the seeker, I set my value true.');
      // Now, check immediately just in case.
      var res = await firestore
        .collection('searching')
        .doc(currentUser.uid)
        .get();
      if (res.data().matchTail === 'true') {
        // OTHER PERSON SAID YES!!!!
        setSuccessMatches();
        console.log('match said yes!!');
        clearTimeout(extended_timeout);
        clearChatData();

        leavePageWith('match_made');
      } else {
        // Nothing yet, lets wait for a change to the matchTail.
        observer.current = firestore
          .collection('searching')
          .doc(currentUser.uid)
          .onSnapshot((docSnapshot) => {
            if (
              docSnapshot &&
              docSnapshot.data() &&
              docSnapshot.data().matchTail === 'true'
            ) {
              // THEY SAID YES !! (but after)
              setSuccessMatches();
              console.log('other person (the match) said yes after');
              if (observer.current !== null) observer.current();
              clearTimeout(extended_timeout);
              clearChatData();

              leavePageWith('match_made');
            }
            if (
              docSnapshot &&
              docSnapshot.data() &&
              docSnapshot.data().matchTail === 'timeout'
            ) {
              // The other person timed out..
              console.log('other person (the match) timed out');
              if (observer.current !== null) observer.current();
              clearTimeout(extended_timeout);
              clearChatData();

              leavePageWith('match_timedout');
            }
          });
      }
    }

    // If im match, I need to set my match to true and wait for seekerTail.
    if (currentUser.uid === match) {
      await firestore.collection('searching').doc(match_id).update({
        matchTail: 'true',
      });
      console.log('I am the match, I set my value true.');
      // Now, check immediately just in case.
      res = await firestore.collection('searching').doc(match_id).get();
      if (res.data().seekerTail === 'true') {
        // OTHER PERSON SAID YES!!!!
        setSuccessMatches();
        console.log('seeker said yes!!');
        clearTimeout(extended_timeout);
        clearChatData();

        leavePageWith('match_made');
      } else {
        // I need to passively listen for a document change.
        observer.current = firestore
          .collection('searching')
          .doc(match_id)
          .onSnapshot((docSnapshot) => {
            if (
              docSnapshot &&
              docSnapshot.data() &&
              docSnapshot.data().seekerTail === 'true'
            ) {
              // THEY SAID YES !! (but after)
              setSuccessMatches();
              console.log('other person (the seeker) said yes after');
              if (observer.current !== null) observer.current();
              clearTimeout(extended_timeout);
              clearChatData();

              leavePageWith('match_made');
            }
            if (
              docSnapshot &&
              docSnapshot.data() &&
              docSnapshot.data().seekerTail === 'timeout'
            ) {
              // The other person timed out..
              console.log('other person (the seeker) timed out');
              if (observer.current !== null) observer.current();
              clearTimeout(extended_timeout);
              clearChatData();

              leavePageWith('match_timedout');
            }
          });
      }
    }
  }

  function MatchModal(props) {
    return (
      <Modal
        {...props}
        size="md"
        aria-labelledby="contained-modal-title-vcenter"
        centered>
        <Modal.Body
          style={{
            backgroundColor: '#e64398',
          }}>
          <h4
            style={{
              color: '#ffffff',
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
            You did the time! Do you want the Dime?
          </h4>
          <h5
            id="initialModal"
            style={{
              color: '#ffffff',
              fontWeight: 'normal',
              textAlign: 'center',
              display: 'block',
            }}>
            Please select Tails to Match or Heads to Pass. If you pass, you will
            no longer be able to find this dime!
          </h5>
          <h5
            id="waitingForMatch"
            style={{
              color: '#ffffff',
              fontWeight: 'normal',
              textAlign: 'center',
              display: 'none',
            }}>
            Waiting for your Match!
          </h5>
          <h5
            id="verifyFailMessage"
            style={{
              color: '#ffffff',
              fontWeight: 'normal',
              textAlign: 'center',
              display: 'none',
            }}>
            Are you sure? If you pass, you will no longer be able to find this
            dime! Please click Heads to Pass.
          </h5>
        </Modal.Body>
        <Modal.Footer className="mx-auto">
          <img
            style={{ height: '200px', width: '200px', cursor: 'pointer' }}
            src="DimeAssets/hearteyes.png"
            id="heartEyesImage"
            onClick={pendingMatch}
            alt="Tails"
          />
          <img
            style={{ height: '200px', width: '200px', cursor: 'pointer' }}
            src="DimeAssets/sleepycoin.png"
            id="sleepyImage"
            onClick={noMatch}
            alt="Heads"
          />
          <img
            style={{
              height: '200px',
              width: '200px',
              cursor: 'pointer',
              display: 'none',
            }}
            src="DimeAssets/coinWaiting.gif"
            id="coinWaiting"
            alt="Waiting..."
          />
        </Modal.Footer>
      </Modal>
    );
  }

  const id = currentUser.uid;

  // this effect only runs once.
  useEffect(() => {
    // This is a timeout that carried over from the last page. It deletes
    // the doc in the background.
    clearTimeout(timeout_5);
    try {
      setMyPhoto(JSON.parse(localStorage.getItem('user_data')).photo);
      setUserInitialized(
        JSON.parse(localStorage.getItem('user_data')).initializedProfile
      );
    } catch (e) {
      console.log('DOESNT BELONG, no data');
      clearChatData();
      if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
      if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);
      window.location.href = '/';
      return;
    }

    // In case the user navigates here directly by accident.
    if (
      history.location &&
      history.location.state &&
      history.location.state.state &&
      history.location.state.state.match_id
    ) {
    } else {
      console.log('DOESNT BELONG, useeffect');
      if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
      if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);
      window.location.href = '/';
      return;
    }

    // This gets the match data.
    fetchMatchInfo().then(() => {
      if (localStorage.getItem('1701') !== null) {
        restorePreviousMessages();
      }
    });
    // const sock = io(bp.buildPath(''), { forceNew: true });
    var sock = io(bp.buildPath(''));
    var roomInUseEffect = '';
    sock.auth = { id };
    sock.connect();
    sock.on('connect', () => {
      console.log(
        `Email: "${currentUser.email}" \n With User ID: "${currentUser.uid}" connected with socket id: "${sock.id}"`
      );
    });
    sock.on('error', () => {
      console.log('ERROR..');
    });
    sock.on('disconnect', () => {
      console.log('DISCONNECT..');
    });

    if (localStorage.getItem('chatExpiry') === null) {
      var exp = Date.now() + EXPIRE_IN_MINUTES * 60000;
      localStorage.setItem('chatExpiry', exp);
      console.log('set to', exp);
    }

    var checkLoop = setInterval(() => {
      if (window.location.pathname !== '/chat') {
        clearInterval(checkLoop);
        return;
      }

      var current = Date.now();
      checkSearchingDoc(sock);
      if (current >= localStorage.getItem('chatExpiry')) {
        // The chat is over, logic for after chat goes here.
        clearInterval(checkLoop);
        setModalShow(true);
        setAfterChat(true);
        refAfterChat.current = true;
        timeoutRef1.current = setTimeout(() => {
          console.log('calling no match timeout');

          noMatchTimeout();
        }, modalExpire);
      }
    }, 5000);

    var current_time = Date.now();
    checkSearchingDoc(sock);
    if (current_time >= localStorage.getItem('chatExpiry')) {
      //Modal match vs non-match
      // The chat is over, logic for after chat goes here.
      console.log('i ran once');
      clearInterval(checkLoop); // cancels the first loop.
      setModalShow(true);
      setAfterChat(true);
      refAfterChat.current = true;
      timeoutRef2.current = setTimeout(() => {
        console.log('calling no match timeout 2');
        noMatchTimeout();
      }, modalExpire);
    }

    // This is new!
    // We get both ids, and sort them alphabetically.
    // The concatenated string is the unique room id!
    const ids = [currentUser.uid, match_id];
    ids.sort();
    const new_room = ids[0] + ids[1];
    sock.emit(
      'join-room',
      currentUser.uid.toString(),
      new_room.toString(),
      function (message) {
        if (message === 'joined') {
          console.log('callback called, joining room now.');
          setRoom(new_room);
          roomRef.current = new_room;
          roomInUseEffect = new_room;
          localStorage.setItem(
            'inActiveChat',
            JSON.stringify({ status: 'true', id_match: match_id })
          );
          // // localStorage.setItem('activeSocket', JSON.stringify(sock));
          // console.log(sock);
          // console.log(socket);
          const emojis = ['❤️', '🥰', '😇'];
          var random_emoji = emojis[Math.floor(Math.random() * 3)];
          displayMessage(
            'Joined the room. Good luck! ' + random_emoji,
            'system'
          );
        }
      }
    );

    setSocket(sock);
    socketRef.current = sock;
    // Wait for incoming private messages.
    sock.on('message', (message, user, messageID) => {
      if (user !== currentUser.uid) {
        displayMessage(message, 'received');
        localStorage.setItem(JSON.stringify(localStorageKey.current), 'them');
        localStorageKey.current += 7;
        localStorage.setItem(JSON.stringify(localStorageKey.current), message);
        localStorageKey.current += 7;
        sock.emit(
          'seen-message',
          currentUser.uid,
          new_room,
          messageID,
          function () {
            // console.log('I sent to the room that I saw that message.');
          }
        );
      }
      // console.log(user);
    });

    sock.on('image', (message, user, message_ID) => {
      if (user !== currentUser.uid) {
        var image = new Image();
        image.src = message;
        image.onload = () => {
          // console.log(image.width);
          // console.log(image.height);
          // console.log('Calculated new height.');
          var image_scale = image.width / MESSAGE_IMAGE_WIDTH;
          image.width = image.width / image_scale;
          image.height = image.height / image_scale;
          // console.log(image.width);
          // console.log(image.height);

          // Pass the result, the image height as well to get proper sizing.
          displayImage(message, 'received', image.height);

          sock.emit(
            'seen-message',
            currentUser.uid,
            new_room,
            message_ID,
            function () {
              // console.log('I sent to the room that I saw that message.');
            }
          );
          image.onload = null;
        };
      }
      // console.log(user);
    });

    sock.on('seen', (messageID) => {
      if (document.getElementById(messageID) !== null)
        document.getElementById(messageID).remove();
    });

    sock.on('abandoned', (message) => {
      //match left & setting the pair as no match
      displayMessage('Your match left the chat. Switching..', 'system');
      clearChatData();

      setTimeout(async () => {
        await firestore
          .collection('users')
          .doc(currentUser.uid)
          .update({
            FailMatch: firebase.firestore.FieldValue.arrayUnion(match_id),
          });
        await firestore
          .collection('users')
          .doc(match_id)
          .update({
            FailMatch: firebase.firestore.FieldValue.arrayUnion(
              currentUser.uid
            ),
          });

        console.log(refAfterChat.current);
        if (!refAfterChat.current) {
          history.push('/after', {
            state: { match_id: match_id, type: 'match_abandoned' },
          });
        } else {
          history.push('/after', {
            state: { match_id: match_id, type: 'match_didnt_go_well' },
          });
        }
        sock.emit('leave-room', currentUser.uid, room);
        if (timeoutRef1.current !== undefined)
          clearTimeout(timeoutRef1.current);
        if (timeoutRef2.current !== undefined)
          clearTimeout(timeoutRef2.current);
        if (extendedTimeoutRef.current !== undefined)
          clearTimeout(extendedTimeoutRef.current);
        console.log('LEFT MY ROOM');
      }, 0);
    });

    // All this is duplicate logic for new listeners when the
    // user comes BACK online. this only fires when offline -> online.
    window.ononline = (event) => {
      console.log('You are now connected to the network.');
      displayMessage('You are back online!', 'system');
      if (window.location.pathname === '/chat') {
        sock.emit('leave-room-silently', currentUser.uid, room);
        sock = io(bp.buildPath(''));
        roomInUseEffect = '';
        sock.auth = { id };
        sock.connect();
        sock.on('connect', () => {
          console.log(
            `Email: "${currentUser.email}" \n With User ID: "${currentUser.uid}" connected with socket id: "${sock.id}"`
          );
        });
        setSocket(sock);
        socketRef.current = sock;
        sock.on('message', (message, user, messageID) => {
          if (user !== currentUser.uid) {
            displayMessage(message, 'received');
            localStorage.setItem(
              JSON.stringify(localStorageKey.current),
              'them'
            );
            localStorageKey.current += 7;
            localStorage.setItem(
              JSON.stringify(localStorageKey.current),
              message
            );
            localStorageKey.current += 7;
            sock.emit(
              'seen-message',
              currentUser.uid,
              new_room,
              messageID,
              function () {
                // console.log('I sent to the room that I saw that message.');
              }
            );
          }
          // console.log(user);
        });

        sock.on('image', (message, user, message_ID) => {
          if (user !== currentUser.uid) {
            var image = new Image();
            image.src = message;
            image.onload = () => {
              // console.log(image.width);
              // console.log(image.height);
              // console.log('Calculated new height.');
              var image_scale = image.width / MESSAGE_IMAGE_WIDTH;
              image.width = image.width / image_scale;
              image.height = image.height / image_scale;
              // console.log(image.width);
              // console.log(image.height);

              // Pass the result, the image height as well to get proper sizing.
              displayImage(message, 'received', image.height);

              sock.emit(
                'seen-message',
                currentUser.uid,
                new_room,
                message_ID,
                function () {
                  // console.log('I sent to the room that I saw that message.');
                }
              );
              image.onload = null;
            };
          }
          // console.log(user);
        });

        sock.on('seen', (messageID) => {
          if (document.getElementById(messageID) !== null)
            document.getElementById(messageID).remove();
        });

        sock.on('abandoned', (message) => {
          //match left & setting the pair as no match
          displayMessage('Your match left the chat. Switching..', 'system');
          clearChatData();

          setTimeout(async () => {
            await firestore
              .collection('users')
              .doc(currentUser.uid)
              .update({
                FailMatch: firebase.firestore.FieldValue.arrayUnion(match_id),
              });
            await firestore
              .collection('users')
              .doc(match_id)
              .update({
                FailMatch: firebase.firestore.FieldValue.arrayUnion(
                  currentUser.uid
                ),
              });

            console.log(refAfterChat.current);
            if (!refAfterChat.current) {
              history.push('/after', {
                state: { match_id: match_id, type: 'match_abandoned' },
              });
            } else {
              history.push('/after', {
                state: { match_id: match_id, type: 'match_didnt_go_well' },
              });
            }
            sock.emit('leave-room', currentUser.uid, room);
            if (timeoutRef1.current !== undefined)
              clearTimeout(timeoutRef1.current);
            if (timeoutRef2.current !== undefined)
              clearTimeout(timeoutRef2.current);
            if (extendedTimeoutRef.current !== undefined)
              clearTimeout(extendedTimeoutRef.current);
            console.log('LEFT MY ROOM');
          }, 0);
        });
        sock.emit(
          'join-room',
          currentUser.uid.toString(),
          new_room.toString(),
          function (message) {
            if (message === 'joined') {
              console.log('callback called, joining room now.');
              setRoom(new_room);
              roomRef.current = new_room;
              roomInUseEffect = new_room;
              localStorage.setItem(
                'inActiveChat',
                JSON.stringify({ status: 'true', id_match: match_id })
              );
              // // localStorage.setItem('activeSocket', JSON.stringify(sock));
              // console.log(sock);
              // console.log(socket);
              displayMessage('Reconnected to chat.', 'system');
            }
          }
        );
      }
      setIsOffline(false);
    }; // END of window.ononline

    window.onoffline = (event) => {
      console.log('You are NOT connected to the network.');
      displayMessage(
        'You are offline! Messages will try to send when you reconnect.',
        'system'
      );
      setIsOffline(true);
    };
    return () => {
      console.log('Cleanup in Chat.js.');
      if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
      if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);
      if (extendedTimeoutRef.current !== undefined)
        clearTimeout(extendedTimeoutRef.current);
      window.ononline = null;
      window.onoffline = null;
      if (roomInUseEffect !== '' && sock !== undefined && sock !== null) {
        sock.emit('leave-room-silently', currentUser.uid, room);
        console.log('SOCKET: Left the room silently.');
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  //restore previous messages if the localStorage array indicates that some key was used
  function restorePreviousMessages() {
    var temp = 1701;

    while (localStorage.getItem(JSON.stringify(temp)) !== null) {
      if (localStorage.getItem(JSON.stringify(temp)) === 'me') {
        temp += 7;
        displayMessage(localStorage.getItem(JSON.stringify(temp)), 'sent');
      } else {
        temp += 7;
        displayMessage(localStorage.getItem(JSON.stringify(temp)), 'received');
      }
      temp += 7;
    }
    localStorageKey.current = temp;
  }

  function doubleCheck(f, identifier) {
    var text = 'Are you sure you want to do this?';
    if (identifier === 'report')
      text += ' Reporting will not alert the other user.';

    if (window.confirm(text)) {
      f();
      return true;
    } else return false;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const message = messageRef.current.value;

    if (photoAttachRef.current.files.length === 1) {
      setSendingPhoto(true);
      const reader = new FileReader();
      console.log('new reader');
      var the_image = photoAttachRef.current.files[0];
      var compressed = the_image;
      if (the_image.type === 'image/gif' && the_image.size < 500000) {
      } else {
        compressed = await imageCompression(the_image, {
          maxSizeMB: 0.5,
          maxIteration: 10,
        });
      }

      reader.readAsDataURL(compressed);

      reader.onloadend = function () {
        console.log('finished reading.');

        var image = new Image();
        image.src = reader.result;

        image.onload = () => {
          var image_scale = image.width / MESSAGE_IMAGE_WIDTH;
          image.width = image.width / image_scale;
          image.height = image.height / image_scale;

          var image_id = Date().toString() + image.height.toString();
          // Pass the result, the image height as well to get proper sizing.
          displayImage(reader.result, 'sent', image.height, image_id);
          // scrollReference;
          console.log(reader.result.length);
          socket.emit(
            'send-image-to-room',
            currentUser.uid,
            room,
            reader.result,
            image_id
            // function () {
            //   console.log('recieved on server side.');
            // }
          );
          photoAttachRef.current.value = null;
          photoButtonRef.current = 'Photo';
          image.onload = null;
          setPhotoName('');
          setSendingPhoto(false);
          setNoPhoto(true);
        };

        reader.onloadend = null;
      };
    }
    if (message === '') return;

    var messageID = '';

    function hash_str(str) {
      var hash = 0,
        i,
        chr;
      if (str.length === 0) return hash;
      for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash + Date().toString() + Math.random(100).toString();
    }
    messageID = hash_str(message).toString();

    // console.log('Delivered!', messageID);
    displayMessage(message, 'sent', messageID, isOffline);
    console.log(isOffline);
    //send value of message to local storage IF were online.
    if (!isOffline) {
      localStorage.setItem(JSON.stringify(localStorageKey.current), 'me');
      localStorageKey.current += 7;
      localStorage.setItem(JSON.stringify(localStorageKey.current), message);
      localStorageKey.current += 7;
    }

    // ARGS ARE: from, room, message
    socket.emit(
      'send-to-room',
      currentUser.uid,
      room,
      message,
      messageID,
      isOffline,
      function (originally_sent_offline, message_sent) {
        // This function gets called when message reaches the server.
        if (
          originally_sent_offline &&
          document.getElementById(messageID) !== null
        ) {
          // This is not *actually* undelivered, but the
          // seen event will end up deleting this message if the message
          // gets delivered. So if this remains then it probably wasn't
          // delivered.
          document.getElementById(messageID).innerHTML =
            ' <i class="fas fa-exclamation-triangle"></i> ' +
            'undelivered&nbsp;';

          localStorage.setItem(JSON.stringify(localStorageKey.current), 'me');
          localStorageKey.current += 7;
          localStorage.setItem(
            JSON.stringify(localStorageKey.current),
            message_sent
          );
          localStorageKey.current += 7;
        }
      }
    );
    messageRef.current.value = '';
  }

  function displayImage(message, mode, height, messageID) {
    if (window.location.pathname === '/chat') {
      var suffix = '';
      if (mode === 'received') {
        suffix = ' (them)';
      } else if (mode === 'sent') {
        suffix = ' (you)';
      } else if (mode === 'system') {
        suffix = ' [[sys msg, remove suffix later]]';
      }
      const div = document.createElement('div');
      const image_container = document.createElement('div');
      image_container.classList.add('image-container');
      const img_message = document.createElement('img');

      const subtext = document.createElement('code');
      subtext.innerHTML =
        ' <i class="fas fa-exclamation-triangle"></i> ' + 'undelivered&nbsp;';

      subtext.setAttribute('id', messageID);
      subtext.setAttribute('class', 'subtext-' + mode);

      const image = document.createElement('img');
      img_message.width = `${MESSAGE_IMAGE_WIDTH}`;
      // img_message.height = '200';
      if (mode === 'received') {
        image.src = matchPhotoRef.current;
      } else {
        image.src = myPhotoRef.current;
      }
      image.classList.add('chat-image');
      img_message.classList.add('chat-message-image');
      div.classList.add('message');
      div.classList.add(mode);

      // p.textContent = message;
      img_message.src = message;
      if (mode !== 'system') div.appendChild(image);

      image_container.appendChild(img_message);

      div.appendChild(image_container);

      document.getElementById('message-container').append(div);
      if (mode === 'sent' && messageID !== '')
        document.getElementById('message-container').append(subtext);
      document.getElementById('scrollReference').style.height = height / 2 + 50;
      document
        .getElementById('scrollReference')
        .scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Two modes added for some extra processing (like maybe classes or etc)
  function displayMessage(message, mode, messageID = '', is_offline) {
    if (window.location.pathname === '/chat') {
      var suffix = '';
      if (mode === 'received') {
        suffix = ' (them)';
        // const div = document.createElement('div');
        // div.textContent = message + suffix;
        // document.getElementById('message-recv').append(div);
      } else if (mode === 'sent') {
        suffix = ' (you)';
        // const div = document.createElement('div');
        // div.textContent = message + suffix;
        // document.getElementById('message-sent').append(div);
        // isSentByCurrentUser = true;
      } else if (mode === 'system') {
        suffix = ' [[sys msg, remove suffix later]]';
        // const div = document.createElement('div');
        // div.textContent = message + suffix;
        // document.getElementById('message-container').append(div);
      }
      const div = document.createElement('div');

      const p = document.createElement('p');

      const subtext = document.createElement('code');
      subtext.innerHTML =
        ' <i class="fas fa-exclamation-triangle"></i> ' + 'undelivered&nbsp;';
      if (is_offline) {
        subtext.innerHTML =
          ' <i class="fas fa-wifi"></i> ' + 'sent offline&nbsp;';
      }
      subtext.setAttribute('id', messageID);
      subtext.setAttribute('class', 'subtext-' + mode);

      const image = document.createElement('img');
      if (mode === 'received') {
        image.src = matchPhotoRef.current;
      } else {
        image.src = myPhotoRef.current;
      }
      image.classList.add('chat-image');

      div.classList.add('message');
      div.classList.add(mode);

      p.textContent = message;
      if (mode !== 'system') div.appendChild(image);
      div.appendChild(p);

      document.getElementById('message-container').append(div);
      if (mode === 'sent' && messageID !== '')
        document.getElementById('message-container').append(subtext);
      document
        .getElementById('scrollReference')
        .scrollIntoView({ behavior: 'smooth' });
    }
  }

  //erase chat log stored in local storage
  function clearChatData() {
    var temp = 1701;
    console.log('Cleared chat data.');
    localStorage.removeItem('inActiveChat');
    localStorage.removeItem('activeSocket');
    while (localStorage.getItem(JSON.stringify(temp)) !== null) {
      localStorage.removeItem(JSON.stringify(temp));
      temp += 7;
    }
  }

  function handleRandomQuestion(matches_firstname, match_responses) {
    var random_num = Math.floor(Math.random() * 12);
    var selected = questions[random_num];
    var related_emoji = question_emojis[random_num];
    displayMessage(`${matches_firstname} was asked: ${selected}\n`, 'system');
    displayMessage(`${related_emoji} ${match_responses[random_num]}`, 'system');
  }
  async function handleReport() {
    var chat_history = [];

    var temp = 1701;

    while (localStorage.getItem(JSON.stringify(temp)) !== null) {
      if (localStorage.getItem(JSON.stringify(temp)) === 'me') {
        temp += 7;
        chat_history.push(
          '[me] ' +
            `[${currentUser.uid}] ` +
            localStorage.getItem(JSON.stringify(temp))
        );
      } else {
        temp += 7;
        chat_history.push(
          `[${match_name}] ` +
            `[${match_id}] ` +
            localStorage.getItem(JSON.stringify(temp))
        );
      }
      temp += 7;
    }
    localStorageKey.current = temp;

    console.log(chat_history);

    try {
      var result = await firestore
        .collection('reports')
        .doc(currentUser.uid)
        .get();
      if (result.exists) {
        const obj = {};
        obj[match_id] = chat_history;
        await firestore.collection('reports').doc(currentUser.uid).update(obj);
      } else {
        const obj = {};
        obj[match_id] = chat_history;
        await firestore.collection('reports').doc(currentUser.uid).set(obj);
      }
    } catch (error) {
      console.log(error);
    }

    socketRef.current.emit('leave-room', currentUser.uid, roomRef.current);
    console.log('REPORTED OTHER USER.');
    clearChatData();
    try {
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({
          FailMatch: firebase.firestore.FieldValue.arrayUnion(match_id),
        });
      await firestore
        .collection('users')
        .doc(match_id)
        .update({
          FailMatch: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
        });
    } catch (error) {
      console.log(error);
    }
    if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
    if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);

    history.push('/after', {
      state: { match_id: match_id, type: 'user_reported' },
    });

    return;
  }

  async function handleLogout() {
    try {
      // Push the state to login that we need to purge the old user searches.

      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({
          FailMatch: firebase.firestore.FieldValue.arrayUnion(match_id),
        });
      await firestore
        .collection('users')
        .doc(match_id)
        .update({
          FailMatch: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
        });

      socketRef.current.emit('leave-room', currentUser.uid, roomRef.current);
      console.log('LEFT ROOM DUE TO LOGOUT');
      clearChatData();
      if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
      if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);
      await logout();
      history.push('/login', {
        state: { fromHome: true, oldID: currentUser.uid },
      });
      localStorage.removeItem('user_data');

      // window.location.reload();
    } catch {
      setError('Failed to log out');
    }
  }

  function redirectToHome() {
    // socket.emit('leave-room', currentUser.uid, room);
    socketRef.current.emit('leave-room', currentUser.uid, roomRef.current);
    console.log('LEFT ROOM WENT HOME');
    clearChatData();
    if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
    if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);
    history.push('/');
    // window.location.reload(); CHANGED_NOW
  }

  async function redirectToAfter() {
    // user left & setting pair to no match
    socket.emit('leave-room', currentUser.uid, room);
    console.log('LEFT ROOM: REDIRECT TO AFTER');
    clearChatData();
    await firestore
      .collection('users')
      .doc(currentUser.uid)
      .update({
        FailMatch: firebase.firestore.FieldValue.arrayUnion(match_id),
      });
    await firestore
      .collection('users')
      .doc(match_id)
      .update({
        FailMatch: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
      });
    if (timeoutRef1.current !== undefined) clearTimeout(timeoutRef1.current);
    if (timeoutRef2.current !== undefined) clearTimeout(timeoutRef2.current);

    history.push('/after', {
      state: { match_id: match_id, type: 'user_abandoned' },
    });
  }

  document.body.style.backgroundColor = 'white';
  return (
    <React.Fragment>
      <AppBar
        style={{ background: '#ffffff' }}
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}>
        <Toolbar>
          <Typography variant="h6" noWrap className={classes.title}>
            <Navbar bg="transparent">
              <Navbar.Brand>
                <img
                  // style={{ cursor: 'pointer' }}
                  src="/DimeAssets/headerlogo.png"
                  className="d-inline-block align-top header-logo"
                  alt="logo"
                  href="home"
                  onClick={() => {}}
                />
              </Navbar.Brand>
            </Navbar>
          </Typography>
          <Tooltip
            TransitionComponent={Zoom}
            title={'You will not be rematched!'}>
            <Button
              hidden={open}
              className="btn-chat abandon mx-3"
              onClick={redirectToAfter}>
              Abandon Chat
            </Button>
          </Tooltip>
          <IconButton
            color="default"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            className={clsx(open && classes.hide)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
        {switching && (
          <div>
            <LinearProgress style={{ backgroundColor: 'pink' }} />
          </div>
        )}
      </AppBar>

      {error && <Alert severity="error">{error}</Alert>}

      <Collapse in={match_photo !== ''}>
        <Grid
          container
          className="match-photo-container"
          direction="column"
          justifyContent="flex-end"
          alignItems="center"
          style={{
            marginTop: '100px',
          }}>
          {match_photo !== '' ? (
            <ReactRoundedImage
              imageHeight="150"
              imageWidth="150"
              image={match_photo}
              className="img-fluid"
              roundedSize="13"
              borderRadius="150"
              alt="My Profile Pic"
              hoverColor="pink"
            />
          ) : null}

          <span
            className="text-center mb-3 chat-match-info"
            style={{ color: '#E64398' }}>
            <AccountBoxIcon style={{ marginBottom: '2px' }} /> {match_name} •{' '}
            {match_age} • {match_sex}
          </span>
        </Grid>
      </Collapse>
      <React.Fragment>
        <Container>
          <hr></hr>
          <div id="message-container" className=""></div>
          <div style={{ height: '60px' }} id="scrollReference"></div>

          <div className="footer">
            {!afterChat && (
              <Container>
                <Form onSubmit={handleSubmit}>
                  <input
                    onChange={(e) => {
                      console.log(photoAttachRef.current.files);
                      if (photoAttachRef.current.files.length === 1) {
                        console.log('set no photo to false');
                        setNoPhoto(false);
                        setPhotoName(
                          photoAttachRef.current.files[0].name.substring(0, 6) +
                            '..'
                        );
                        // photoButtonRef.current.textContent =
                        //   photoAttachRef.current.files[0].name.substring(0, 5) +
                        //   '..';
                      }
                    }}
                    ref={photoAttachRef}
                    accept="image/*"
                    id="photoAttach"
                    hidden
                    type="file"
                  />

                  <InputGroup>
                    <Tooltip
                      TransitionComponent={Zoom}
                      title={'Send an image!'}>
                      <Button
                        ref={photoButtonRef}
                        onClick={() => {
                          document.getElementById('photoAttach').click();
                        }}>
                        <AddPhotoAlternateIcon
                          hidden={!noPhoto}
                          style={{
                            marginBottom: '5px',
                          }}></AddPhotoAlternateIcon>
                        <div style={{ fontSize: '16px' }} hidden={noPhoto}>
                          {photoName}
                        </div>
                      </Button>
                    </Tooltip>
                    <FormControl
                      placeholder="Say hi! 👋"
                      aria-label="Message"
                      type="text"
                      id="message_input"
                      autoComplete="off"
                      ref={messageRef}
                    />
                    <Button
                      disabled={room === '' || afterChat ? true : false}
                      type="submit"
                      id="send-button">
                      <div>
                        Send{' '}
                        <SendIcon
                          hidden={sendingPhoto}
                          style={{
                            marginBottom: '5px',
                          }}></SendIcon>
                        <CircularProgress
                          size="25px"
                          style={{
                            color: 'white',
                            position: 'relative',
                            bottom: '-3px',
                          }}
                          hidden={!sendingPhoto}
                        />
                      </div>
                    </Button>
                  </InputGroup>
                </Form>
              </Container>
            )}
          </div>
        </Container>
        {/* <Button
          className={!afterChat ? 'btn btn-danger' : 'btn btn-primary'}
          onClick={!afterChat ? redirectToAfter : redirectToHome}>
          {!afterChat ? 'Abandon Chat' : 'Go Home'}
        </Button> */}
      </React.Fragment>
      {/* <div className="w-100 text-center mt-2">
        <Button variant="link" onClick={handleLogout}>
          Log Out
        </Button>
      </div> */}
      <MatchModal
        backdrop="static"
        show={modalShow}
        onHide={() => setModalShow(false)}
      />
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor="right"
        open={open}
        classes={{
          paper: classes.drawerPaper,
        }}>
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon
                style={{ color: '#e64398', fontSize: '30px' }}
              />
            )}
          </IconButton>
        </div>
        <Divider style={{ background: '#e64398' }} />
        <List>
          {itemsList.current.map((item, index) => {
            const { text, icon, tooltip, onClick } = item;
            const redBGifReport =
              text === 'Report Chat' ? { backgroundColor: '#da3636' } : null;
            const classToUse =
              text === 'Report Chat'
                ? classes.listItemReportText
                : classes.listItemText;

            return (
              <Tooltip
                placement="left"
                TransitionComponent={Zoom}
                title={tooltip}
                key={text}>
                <ListItem
                  className="drawer-item"
                  button
                  onClick={onClick}
                  style={redBGifReport}>
                  {icon && <ListItemIcon>{icon}</ListItemIcon>}

                  <ListItemText
                    classes={{ primary: classToUse }}
                    primary={text}
                  />
                </ListItem>
              </Tooltip>
            );
          })}
        </List>
      </Drawer>
    </React.Fragment>
  );
}
