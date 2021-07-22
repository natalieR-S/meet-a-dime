import React, { useState, useEffect, useRef } from 'react';
// import { Button, Alert, Container } from 'react-bootstrap';
import { Navbar, Button, Form, Col, Row, Card } from 'react-bootstrap';
import { Alert } from '@material-ui/lab';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import Backdrop from '@material-ui/core/Backdrop';
// import AddShoppingCartIcon from '@material-ui/icons/AddShoppingCart';
// import PhotoCamera from '@material-ui/icons/PhotoCamera';
// import Container from '@material-ui/core/Container';
// import Button from '@material-ui/core/Button';
import Modal from '@material-ui/core/Modal';
// import Box from '@material-ui/core/Box';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
// import { Link } from 'react-router-dom';
import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import moment from 'moment';

import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import ChatIcon from '@material-ui/icons/Chat';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import Zoom from '@material-ui/core/Zoom';
import Fade from '@material-ui/core/Fade';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import ExitToAppIcon from '@material-ui/icons/ExitToApp';
// import TextField from '@material-ui/core/TextField';
import LinearProgress from '@material-ui/core/LinearProgress';
import Tooltip from '@material-ui/core/Tooltip';
import PersonIcon from '@material-ui/icons/Person';

// import Paper from '@material-ui/core/Paper';
// import Grid from '@material-ui/core/Grid';

var bp = require('../Path.js');
moment.suppressDeprecationWarnings = true;
const drawerWidth = 300;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
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

export default function Home() {
  // Drawer
  const classes = useStyles();

  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  function checkMouse() {
    // console.log(mouseRef.current);
    return mouseRef.current;
  }

  //Search Modal Functions
  const [sopen, setOpenSearch] = React.useState(false);

  const handleSearchOpen = () => {
    // setTooltipOpen(false);
    setOpenSearch(true);
    handleDrawerClose();
    searching();
  };

  const handleSearchClose = () => {
    killSearch();
    setOpenSearch(false);
  };

  const itemsList = [
    {
      text: 'New Chat',
      tooltip: 'Find a Dime!',
      icon: <ChatIcon style={{ color: '#e64398' }} />,
      onClick: handleSearchOpen,
    },
    {
      tooltip: 'Change your preferences and upload a photo!',
      text: 'Profile',
      icon: <PersonIcon style={{ color: '#e64398' }} />,
      onClick: redirectToProfile,
    },
    {
      tooltip: 'Ends your session.', // this is a bit of a stretch..
      text: 'Logout',
      icon: <ExitToAppIcon style={{ color: '#e64398' }} />,
      onClick: handleLogout,
    },
  ];

  const [matchesArray, setMatchesArray] = useState([]);

  const observer = useRef(null);
  const transferTimeoutRef = useRef();

  // error corresponds to an alert that will display err messages.
  const [error, setError] = useState('');
  // when lockout is true, the search button is disabled. this is for
  // locking the button while states are changing or loading is occuring
  const [lockout, setLockout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myPhoto, setMyPhoto] = useState('');
  const [matchPhotos, setMatchPhotos] = useState('');
  const [progress, setProgress] = useState(-1);
  const [inActiveChat, setInActiveChat] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [timeoutSnackbar, setTimeoutSnackbar] = useState(false);
  const [previousMatchesLoading, setPreviousMatchesLoading] = useState(false);
  const matchSearchbarRef = useRef('');
  const scrollRef = useRef(null);
  // const [tooltipOpen, setTooltipOpen] = useState(false);
  const [mouseOverDiv, setMouseOverDiv] = useState(false);
  const mouseRef = useRef(false);
  const [searchMatchesOnce, setSearchMatchesOnce] = useState(false);

  const [name, setName] = useState('');
  // the firebase firestore instance, used to query, add, delete, edit from DB.
  const firestore = firebase.firestore();
  // The currentUser object represents the authenticated firebase user.
  // This is guaranteed to be here when rendered, because of the routes.
  const { currentUser, logout } = useAuth();
  // The match is the state the user is in, "not searching" searching or found.
  const [match, setMatch] = useState('Not searching.');
  const [id_of_match, setId] = useState('none');
  // Search timeout in milliseconds
  const MS_BEFORE_ABANDON_SEARCH = 10000;
  const MS_TRANSFER_TO_CHAT = 3000;
  // Before match expires. they are separate just incase.
  // const MS_BEFORE_ABANDON_MATCH_DOCJOIN = 10000;
  // const MS_BEFORE_ABANDON_MATCH_DOCHOST = 10000;
  // The observer will eventually be a function that listens for changes
  // to the database. to prevent resource leaks, we can call observer()
  // to stop listening ('unsubscribe' to changes)
  // var observer = null;
  // The history is for redirects.
  const history = useHistory();
  // var timeout1 = null;
  // var timeout2 = null;
  // var timeout3 = null;
  // var timeout4 = null;
  // var timeout5 = null;
  const timeout5 = useRef(null);

  // Basic user info for their preferences. Will be referenced in search.

  // THIS IS BAD: I changed to a useRef right after this.
  // it turns out this will just reinitialize on every state change.

  // var userInfo = {
  //   birth: '',
  //   exitMessage: '',
  //   firstName: '',
  //   sex: '',
  //   sexOrientation: '',
  //   photo: '',
  //   ageRangeMin: '',
  //   ageRangeMax: '',
  // };

  const userInfoRef = useRef({
    birth: '',
    exitMessage: '',
    firstName: '',
    sex: '',
    sexOrientation: '',
    photo: '',
    ageRangeMin: '',
    ageRangeMax: '',
  });

  const matchInfoRef = useRef({
    firstName: '',
    lastName: '',
    photo: '',
    phone: '',
    sex: '',
    exitMessage: '',
  });

  // useEffect occurs only once on page load.
  // This will clear any record of the user in the 'searching' collection
  // so that it not only resets the searching state, but
  // could signal to other users that they are no longer available.
  // this works by setting the match field to empty if it exists, or if
  // they are the doc owner it just sets the field to "" and then deletes.
  //
  // The matching algorithm/mechanism is described after the useEffect, in
  // the search function.
  useEffect(() => {
    // console.log(currentUser.getIdToken());
    document.body.style.backgroundColor = 'white';

    async function getIntialUserPhoto() {
      try {
        const token = currentUser && (await currentUser.getIdToken());
        // console.log(token);
        var config = {
          method: 'post',
          url: bp.buildPath('api/getbasicuser'),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          data: { uid: currentUser.uid },
        };
        var response = await axios(config);
        setMyPhoto(response.data.photo);
        if (myPhoto) console.log(myPhoto);
        setName(response.data.firstName);
      } catch (error) {
        console.log(error);
        console.log('issue in fetch data');
      }
      // document.getElementById('photo').src = userInfo.photo;
    }

    async function purgeOld() {
      // If I'm in an active chat, lets not remove the old searching docs.
      if (localStorage.getItem('inActiveChat') !== null) {
        if (
          JSON.parse(localStorage.getItem('inActiveChat')).status === 'true'
        ) {
          setLockout(true);
          setInActiveChat(true);
          return;
        }
      } else {
        localStorage.removeItem('chatExpiry');
      }
      // Lock the search button until these tasks are complete.
      setLockout(true);
      console.log('I SHOULD ONLY PRINT ONCE PER PAGE LOAD');
      try {
        // If I am "document host", clear the match field first.
        try {
          await firestore
            .collection('searching')
            .doc(currentUser.uid)
            .update({ match: '' });
          console.log('cleared old match before delete');
        } catch (error) {
          console.log('tried to clear match before delete, but failed');
          console.log('most of the time this is ok');
          // this is okay because this most likely wont exist on each load.
        }

        // Delete the document (if exists) if I am a "document host".
        await firestore.collection('searching').doc(currentUser.uid).delete();

        // The final mechanism for clearing. This is if I was a previous
        // "document joiner" or "filling in" the existing doc.
        // I will search all docs where my id is the match field, and clear it.
        // This will signal to those listening to that field that I am
        // no longer available.
        firestore
          .collection('searching')
          .where('match', '==', currentUser.uid)
          .get()
          .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
              try {
                firestore
                  .collection('searching')
                  .doc(doc.id)
                  .update({ match: '' });
              } catch (error) {
                console.log('doc match clear error on start');
              }
            });
          })
          .catch((error) => {
            console.log('Error getting documents: ', error);
          });
      } catch (error) {
        console.log(error);
      }
      // Unlock the button now that initial tasks are done.
      setLockout(false);
      setLoading(false);
    }

    // call the functions that were just defined here.
    purgeOld();
    getIntialUserPhoto();
    fetchSuccessMatch('', true);

    function scrollHandler(e) {
      if (checkMouse()) {
        e.preventDefault();

        if (
          e.deltaY > 0 &&
          document.getElementById('home-scrolling') !== null
        ) {
          document
            .getElementById('home-scrolling')
            .scrollBy(e.deltaY / 3, 0, 'smooth');
        }
        if (
          e.deltaY < 0 &&
          document.getElementById('home-scrolling') !== null
        ) {
          document
            .getElementById('home-scrolling')
            .scrollBy(e.deltaY / 3, 0, 'smooth');
        }
      }
    }

    window.addEventListener('wheel', scrollHandler, { passive: false });

    return () => {
      clearTimeout(timeout5.current);
      window.removeEventListener('wheel', scrollHandler);
      clearAllTimeouts();
      console.log('LEAVING!');
      if (observer.current !== null) {
        observer.current();
      } else {
        console.log('could not clear observer');
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect users if they are not verified.
  if (!currentUser.emailVerified) {
    history.push('/verify');
  }

  // This makes a POST request to the server listening at /api/getuser
  // It returns the user's search preferences.
  async function fetchData() {
    try {
      const token = currentUser && (await currentUser.getIdToken());
      var config = {
        method: 'post',
        url: bp.buildPath('api/getuser'),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: { uid: currentUser.uid },
      };

      var response = await axios(config);
      console.log(response.data);

      userInfoRef.current.birth = response.data.birth;
      userInfoRef.current.exitMessage = response.data.exitMessage;
      userInfoRef.current.firstName = response.data.firstName;
      userInfoRef.current.sex = response.data.sex;
      userInfoRef.current.sexOrientation = response.data.sexOrientation;
      userInfoRef.current.photo = response.data.photo;
      userInfoRef.current.ageRangeMax = response.data.ageRangeMax;
      userInfoRef.current.ageRangeMin = response.data.ageRangeMin;

      // Set this into local storage for easy reference and persistence.
      localStorage.setItem('user_data', JSON.stringify(response.data));
    } catch (error) {
      console.log(error);
      console.log('issue in fetch data');
    }
  }

  // This makes a POST request to the server listening at /api/getmatches
  // It returns the user's Success Match array.
  async function fetchSuccessMatch(query = '', initial = false) {
    try {
      setPreviousMatchesLoading(true);
      if (!initial) {
        setSearchMatchesOnce(true);
      }
      const token = currentUser && (await currentUser.getIdToken());
      var config = {
        method: 'post',
        url: bp.buildPath('api/getmatches'),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: { uid: currentUser.uid, query: query },
      };

      var response = await axios(config);
      setMatchesArray(response.data);
      // console.log(response.data);
    } catch (error) {
      console.log(error);
      console.log('issue in fetch data');
    }
    setPreviousMatchesLoading(false);
  }

  // When the user logs out, call the observer to unsubscribe to changes.
  // and logout.
  async function handleLogout() {
    try {
      // Push the state to login that we need to purge the old user searches.

      await logout();
      localStorage.removeItem('user_data');
      history.push('/login', {
        state: { fromHome: true, oldID: currentUser.uid },
      });
      // Sort of a workaround incase user logs back in quickly.
      // window.location.reload();
    } catch {
      setError('Failed to log out');
    }
  }

  // Used for the profile button in the JSX.
  function redirectToProfile() {
    history.push('/profile');
  }

  function clearAllTimeouts() {
    clearTimeout(timeout5.current);
  }

  async function killSearch() {
    setId('none');
    setMatch('Not searching.');
    setError('');
    clearAllTimeouts();
    if (transferTimeoutRef.current !== undefined)
      clearInterval(transferTimeoutRef.current);
    setProgress(-1);

    // Lock the search button until these tasks are complete.
    setLockout(true);
    setLoading(true);
    console.log('Clicking out of modal');
    if (observer.current !== null) observer.current();
    try {
      // If I am "document host", clear the match field first.
      try {
        await firestore
          .collection('searching')
          .doc(currentUser.uid)
          .update({ match: '' });

        // Delete the document (if exists) if I am a "document host".
        await firestore.collection('searching').doc(currentUser.uid).delete();
      } catch (error) {
        console.log('Threw error of type', error.code);
        // this is okay because this most likely wont exist on each load.
      }

      // The final mechanism for clearing. This is if I was a previous
      // "document joiner" or "filling in" the existing doc.
      // I will search all docs where my id is the match field, and clear it.
      // This will signal to those listening to that field that I am
      // no longer available.
      firestore
        .collection('searching')
        .where('match', '==', currentUser.uid)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            try {
              firestore
                .collection('searching')
                .doc(doc.id)
                .update({ match: '' });
            } catch (error) {
              console.log(error);
            }
          });
        })
        .catch((error) => {
          console.log('Error getting documents: ', error);
        });
    } catch (error) {
      console.log(error);
    }
    // Unlock the button now that initial tasks are done.
    setLockout(false);
    setLoading(false);
  }
  // .
  // ..
  // ...

  // The "waiting room" or search logic!
  // This is a bit long. But it happens in three main stages.
  // First, a description:
  // Users will post a document in the 'searching' collection of the DB,
  // which will have a blank "match" field. In this field, will go the
  // id of the user who matches these criteria.
  // The document contains the users search preferences, which is posted from
  // one of the steps here.

  // The idea is: post a document like an "ad" that you are looking for
  // someone. This is the "document host" that I referred to earlier.
  // The next person can come in and "fill" that document in, or join it.
  // However you want to word it. But users will always try to fill existing
  // documents first, before going and make a new one to be filled.

  // There will always be two types of users here: one that owns the doc,
  // and one that joins the doc (i.e. places their ID *into* the existing doc).

  // The main stages are here:
  //
  // 1. Fetch the user data (search preferences)
  //
  // 2. See if there are any documents that have mutual preferences.
  //    If so, fill that document! I place my ID in their match field.
  //    They are alerted, but now I listen for changes to that doc.
  //    This is now a successful pairing, because I joined their doc.
  //
  // 3. If no doc was found, create a document there. I am now a doc host.
  //    I will listen to that document and wait for the match field to
  //    be filled in. This is not a complete pair yet, my match field
  //    needs to be set by someone else. Listen to the doc and wait.

  // ...
  // ..
  // .

  async function searching() {
    // State for match is now searching.
    setMatch('Searching.');

    // Is there user preferences in the local storage?
    // If not, query the API and get the new data.
    if (localStorage.getItem('user_data') === null) {
      console.log('1: No data set, fetching now.');
      await fetchData();
      try {
      } catch (error) {
        setLockout(false);
        console.log(error);
      }
    } else if (
      JSON.parse(localStorage.getItem('user_data')).uid !== currentUser.uid
    ) {
      alert(
        'You are still logged into another user! You may encounter problems.'
      );
      console.log('2: Data was leftover from some other user.');
      await fetchData();
      try {
      } catch (error) {
        setLockout(false);
        console.log(error);
      }
    } else {
      // otherwise, its in user data so lets just get it.
      var local = JSON.parse(localStorage.getItem('user_data'));
      // console.log('2');
      userInfoRef.current.birth = local.birth;
      userInfoRef.current.exitMessage = local.exitMessage;
      userInfoRef.current.firstName = local.firstName;
      userInfoRef.current.sex = local.sex;
      userInfoRef.current.sexOrientation = local.sexOrientation;
      userInfoRef.current.photo = local.photo;
      userInfoRef.current.ageRangeMax = local.ageRangeMax;
      userInfoRef.current.ageRangeMin = local.ageRangeMin;
    }

    // Lock the search button for now, until tasks are done.
    setLockout(true);
    var matchFound = false; // Match found boolean, for this only.
    var matchInternal = ''; // ID of found, for this function only.

    // Nested function. This is so we can find what sex is being
    // sought, based on our current preferences.
    function getSearchingSex() {
      // Undeveloped preference logic. This NEEDS support for any, rn
      // is only basic support.
      var searchingSex = '';
      if (userInfoRef.current.sexOrientation === 'Heterosexual') {
        if (userInfoRef.current.sex === 'Male') {
          searchingSex = ['Female'];
        } else {
          searchingSex = ['Male'];
        }
      } else if (userInfoRef.current.sexOrientation === 'Homosexual') {
        if (userInfoRef.current.sex === 'Female') {
          searchingSex = ['Female'];
        } else {
          searchingSex = ['Male'];
        }
      } else if (userInfoRef.current.sexOrientation === 'Bisexual') {
        searchingSex = ['Male', 'Female']; // Not working right now.
      }
      return searchingSex;
    }
    // STAGE TWO //
    // Try to find and 'fill' an existing document, to complete a match!

    function fillMatch(doc_id) {
      try {
        // By doing '.update()', I set my ID into their doc
        firestore
          .collection('searching')
          .doc(doc_id)
          .update({ match: currentUser.uid });
        // Match is found! Do the correct tasks.
        matchFound = true;
        // Transfer the user to the chat in 4 seconds.

        var count = 0;
        setProgress(count);
        var local2 = (transferTimeoutRef.current = setInterval(() => {
          count += (100 / MS_TRANSFER_TO_CHAT) * 100;
          setProgress(count);
          // console.log(doc_id);
          if (count >= 100) {
            clearInterval(transferTimeoutRef.current);
            clearInterval(local2);
            count = 0;
            console.log('pushing to chat 2');
            history.push('/chat', {
              state: {
                match_id: doc_id,
                timeout_5: timeout5.current,
              },
            });
          }
        }, 100));

        setId(doc_id);
        setMatch('Found match! ' + doc_id);
        setSnackbarOpen(true);
        // Clear the searching timeout.
        // clearTimeout(timeOut);
        clearAllTimeouts();
        matchInternal = doc_id;
      } catch (error) {
        console.log('324');
      }
    }

    try {
      // Find what sex we are seeking.
      var searchingSex = getSearchingSex();

      // The database query. Check all docs for possible matches.
      var snapshot = await firestore.collection('searching').get();
      snapshot.forEach((doc) => {
        var myAge = moment().diff(userInfoRef.current.birth, 'years');

        if (
          doc.data().match === '' &&
          searchingSex.includes(doc.data().sex) &&
          doc.data().search_sex.includes(userInfoRef.current.sex) &&
          myAge <= doc.data().search_age_end &&
          myAge >= doc.data().search_age_start &&
          doc.data().age >= userInfoRef.current.ageRangeMin &&
          doc.data().age <= userInfoRef.current.ageRangeMax
        ) {
          fillMatch(doc.id);
        }
      });
      //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
      // Still part of phase two. Listen for changes to the doc we
      // just filled in. Its possible the doc owner drops out,
      // and we need to listen for this.
      // Some things not done yet: alert the users their match was dropped.
      // now it just kicks you back to the initial state. This is easy to
      // alert, we can just change a state or something.
      if (matchFound) {
        // console.log('yes, but lets listen for changes');
        // This works only to see if fields changed, not if doc deleted.
        // The workaround is: before deleting, set the match to "" first.
        observer.current = firestore
          .collection('searching')
          .where(firebase.firestore.FieldPath.documentId(), '==', matchInternal)
          .onSnapshot((snapshot) => {
            // console.log(snapshot);
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'modified') {
                // So if the doc filler loses the match, then we need to reset.
                // console.log(`new match info ${change.doc.data().match}`);
                if (change.doc.data().match === '') {
                  // Uh oh. The doc match was just set empty. The doc owner
                  // must have refreshed their session.
                  matchFound = false;
                  setId('none');
                  setMatch('Not searching.');
                  setError('');
                  setOpenSearch(false);
                  // clearTimeout(timeOut);
                  // These two clear all timeouts.
                  clearAllTimeouts();
                  if (transferTimeoutRef.current !== undefined)
                    clearInterval(transferTimeoutRef.current);
                  setProgress(-1);
                  setLockout(false);
                  ////observer();
                }
              }
            });
          });
      }
    } catch (error) {
      console.log(error);
    }

    // STAGE THREE //
    // This is if we didn't find a match, then we need to make our own
    // doc in 'searching' and then just wait for someone to join.
    if (!matchFound) {
      try {
        // Same searching logic as above.
        searchingSex = getSearchingSex();

        // Lets make a new document.
        // ************************************************************8
        // This has no support for age matches yet. We only
        // match based on mutual sex compatibility. The search age values
        // are just there for now, so hopefully we can implement
        // that within the searches.
        await firestore
          .collection('searching')
          .doc(currentUser.uid)
          .set({
            match: '',
            age: moment().diff(userInfoRef.current.birth, 'years'),
            sex: userInfoRef.current.sex,
            search_age_start: userInfoRef.current.ageRangeMin,
            search_age_end: userInfoRef.current.ageRangeMax,
            search_sex: searchingSex,
            seeker: currentUser.uid,
            host_socket_id: '',
            join_socket_id: '',
            seekerTail: 'false',
            matchTail: 'false',
          });
        // Just posted the new doc to the 'searching' collection.
        console.log('DOC CREATED');
        // Hang on to the observer now. This is the listener on my new
        // document. I am waiting for the match field to be filled,
        // but it can also get un-filled. Account for both.
        observer.current = firestore
          .collection('searching')
          .where(
            firebase.firestore.FieldPath.documentId(),
            '==',
            currentUser.uid
          )
          .onSnapshot((docSnapshot) => {
            docSnapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                console.log('added a doc');
                timeout5.current = setTimeout(() => {
                  setTimeoutSnackbar(true);
                  console.log('trying to run timeout 5 in ADD');
                  if (
                    window.location.pathname === '/' &&
                    id_of_match === 'none'
                  ) {
                    console.log('TIMEOUT DOC HOST');
                    setLockout(true);
                    setLoading(true);
                    setOpenSearch(false);

                    // Abandoning the search should involve me clearing the old doc
                    // that I posted up.
                    async function deleteOldRecordAfterAbandon() {
                      try {
                        await firestore
                          .collection('searching')
                          .doc(currentUser.uid)
                          .update({ match: '' });
                        console.log('cleared old match before delete');
                      } catch (error) {
                        console.log(
                          'tried to clear match before delete, but failed'
                        );
                        console.log('most of the time this is ok');
                        // this is okay because this most likely wont exist on each load.
                      }

                      // Delete the document (if exists) if I am a "document host".
                      try {
                        await firestore
                          .collection('searching')
                          .doc(currentUser.uid)
                          .delete();
                        console.log('deleted my doc');
                      } catch (error) {
                        console.log('error:');
                        console.log(error);
                      }
                    }
                    deleteOldRecordAfterAbandon();

                    setMatch('Not searching.');
                    setError('');
                    if (observer.current !== null) {
                      observer.current();
                    } else {
                      console.log('could not clear observer in dochost');
                    }
                    setLockout(false);
                    setLoading(false);
                  } else {
                    console.log('timeout 5 tried to run, but was ignored.');
                  }
                }, MS_BEFORE_ABANDON_SEARCH);
                return;
              }

              console.log('some edit change.');
              clearAllTimeouts();
              // console.log(change.doc.data());
              if (
                change &&
                change.doc &&
                change.doc.data() &&
                change.doc.data().match !== ''
              ) {
                matchFound = true;
                // Transfer the user to the chat in 4 seconds.

                var count = 0;
                setProgress(count);
                var local1 = (transferTimeoutRef.current = setInterval(() => {
                  count += (100 / MS_TRANSFER_TO_CHAT) * 100;
                  setProgress(count);
                  // console.log(docSnapshot.data().match);
                  if (count >= 100) {
                    clearInterval(transferTimeoutRef.current);
                    clearInterval(local1);
                    count = 0;
                    console.log('pushing to chat 1');
                    history.push('/chat', {
                      state: {
                        match_id: change.doc.data().match,
                        timeout_5: timeout5.current,
                      },
                    });
                  }
                }, 100));

                // setId(docSnapshot.data().match);
                setId(change.doc.data().match);
                setMatch('Found match! ' + change.doc.data().match);
                setSnackbarOpen(true);
                // clearTimeout(timeOut);
                clearAllTimeouts();
              } else if (
                change &&
                change.doc &&
                change.doc.data() &&
                change.doc.data().match === ''
              ) {
                // Match left..

                matchFound = false;
                setId('none');
                setMatch('Searching.');

                setError('');
                // setOpenSearch(false);
                // clearTimeout(timeOut);
                // Clear timeouts, to prevent the match abandon refresh.
                clearAllTimeouts();
                if (transferTimeoutRef.current !== undefined)
                  clearInterval(transferTimeoutRef.current);
                setProgress(-1);
                timeout5.current = setTimeout(() => {
                  console.log('trying to run timeout 5');
                  if (
                    window.location.pathname === '/' &&
                    id_of_match === 'none'
                  ) {
                    console.log('TIMEOUT DOC HOST');
                    setLockout(true);
                    setLoading(true);
                    setOpenSearch(false);

                    // Abandoning the search should involve me clearing the old doc
                    // that I posted up.
                    async function deleteOldRecordAfterAbandon() {
                      try {
                        await firestore
                          .collection('searching')
                          .doc(currentUser.uid)
                          .update({ match: '' });
                        console.log('cleared old match before delete');
                      } catch (error) {
                        console.log(
                          'tried to clear match before delete, but failed'
                        );
                        console.log('most of the time this is ok');
                        // this is okay because this most likely wont exist on each load.
                      }

                      // Delete the document (if exists) if I am a "document host".
                      try {
                        await firestore
                          .collection('searching')
                          .doc(currentUser.uid)
                          .delete();
                        console.log('deleted my doc');
                      } catch (error) {
                        console.log('error:');
                        console.log(error);
                      }
                    }
                    deleteOldRecordAfterAbandon();

                    setMatch('Not searching.');
                    setError('');
                    if (observer.current !== null) {
                      observer.current();
                    } else {
                      console.log('could not clear observer in dochost');
                    }
                    setLockout(false);
                    setLoading(false);
                  } else {
                    console.log('timeout 5 tried to run, but was ignored.');
                  }
                }, MS_BEFORE_ABANDON_SEARCH);
              }
            });
            // The data exists AND the match is not empty! We just found one.
          });
      } catch (error) {
        alert(error);
        setLockout(false);
      }

      if (matchFound) {
        // Here is where we would also tell the user to move to the chat.
        // They have MS_BEFORE_ABANDON_MATCH seconds to do so.
        setLockout(true);
      }
    }
  }

  // The actual JSX components. The top is the errors/match states,
  // conditionally rendered.
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
                  src="/DimeAssets/headerlogo.png"
                  className="d-inline-block align-top header-logo"
                  alt="logo"
                  style={{ cursor: 'pointer' }}
                />
              </Navbar.Brand>
            </Navbar>
          </Typography>

          <span>
            <Button
              hidden={open}
              className="btn-chat mx-3"
              disabled={lockout}
              onClick={handleSearchOpen}>
              New Chat
            </Button>
          </span>

          <IconButton
            color="default"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            className={clsx(open && classes.hide)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
        {loading && (
          <div>
            <LinearProgress style={{ backgroundColor: 'pink' }} />
          </div>
        )}
      </AppBar>

      <main
        className={clsx(classes.content, {
          [classes.contentShift]: open,
        })}>
        <div className={classes.drawerHeader} />

        <h2 className=" text-welcome mt-4 mb-3">Welcome back, {name}! </h2>
        <Divider
          style={{
            background: '#7e7e7e',
          }}
        />
        <br></br>
        {/* Fixing search bar */}
        <Row>
          <Form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              fetchSuccessMatch(matchSearchbarRef.current.value);
            }}>
            <Form.Group as={Row} controlId="formPlaintextPassword">
              <Form.Label className="text-matches" column xs="3">
                My Matches
              </Form.Label>
              <Col className="mx-1">
                <Form.Control
                  className="text-search mt-2 mb-4"
                  autoComplete="off"
                  type="search"
                  data-lpignore="true"
                  placeholder="Search for previous matches..."
                  ref={matchSearchbarRef}
                />
              </Col>
            </Form.Group>
          </Form>
        </Row>
        {inActiveChat && (
          <Alert variant="filled" severity="info">
            You are in a chat!{' '}
            {
              <a
                href="#"
                style={{ color: 'white' }}
                onClick={async (e) => {
                  e.preventDefault();
                  console.log('RETURN');
                  if (localStorage.getItem('user_data') === null) {
                    await fetchData();
                  }
                  history.push('/chat', {
                    state: {
                      match_id: JSON.parse(localStorage.getItem('inActiveChat'))
                        .id_match,
                      timeout_5: timeout5.current,
                    },
                  });
                }}>
                Return to chat.
              </a>
            }
          </Alert>
        )}
        {matchesArray && matchesArray.length !== 0 && (
          <div
            ref={scrollRef}
            onMouseEnter={(e) => {
              mouseRef.current = true;
            }}
            onMouseLeave={(e) => {
              mouseRef.current = false;
            }}
            id="home-scrolling">
            {matchesArray.map((vals, index) => {
              // console.log(vals);
              var age = moment().diff(vals.birth, 'years');
              return (
                <Card key={index} className="home-card">
                  <Card.Img
                    variant="top"
                    src={vals.photo}
                    className="card-image"
                  />
                  <Card.Body className="card-body">
                    <Card.Title>
                      {vals.firstName + ' ' + vals.lastName}
                    </Card.Title>
                    <Card.Title className="card-text">
                      {age} • {vals.sex[0]}{' '}
                      <span className="card-text-hidden">• {vals.phone}</span>
                    </Card.Title>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        )}
        {matchesArray && matchesArray.length === 0 && !searchMatchesOnce && (
          <div id="no-previous-matches">No matches yet.. 😔</div>
        )}
        {matchesArray && matchesArray.length === 0 && searchMatchesOnce && (
          <div id="no-previous-matches">No results.</div>
        )}
        {error && <Alert severity="error">{error}</Alert>}

        <Modal
          style={{
            width: '90%',
            maxWidth: 620,
            maxHeight: 620,
            height: '90%',

            marginRight: 'auto',
            marginLeft: 'auto',
            marginTop: 'auto',
            marginBottom: 'auto',
          }}
          open={sopen}
          // onClose={handleSearchClose}
        >
          <Zoom in={sopen}>
            <div
              className="text-center p-3"
              style={{
                // border: '2px solid grey',
                borderRadius: '50px',
                padding: '10px',
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}>
              <img
                style={{
                  width: 420,
                  height: 'auto',

                  marginRight: 'auto',
                  marginLeft: 'auto',
                }}
                className="img-fluid"
                alt="gifload"
                src="DimeAssets/searchcoin.gif"
              />

              <button
                style={{ display: 'block', margin: 'auto' }}
                onClick={handleSearchClose}
                className="btn btn-outline-light">
                Stop Searching
              </button>
            </div>
          </Zoom>
        </Modal>
      </main>
      <Backdrop
        className={classes.backdrop}
        open={previousMatchesLoading}
        onClick={() => {}}>
        <CircularProgress color="inherit" />
      </Backdrop>
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
          {itemsList.map((item, index) => {
            const { text, icon, tooltip, onClick } = item;
            return (
              <Tooltip
                key={text}
                placement="left"
                TransitionComponent={Zoom}
                title={tooltip}>
                <ListItem className="drawer-item" button onClick={onClick}>
                  {icon && <ListItemIcon>{icon}</ListItemIcon>}

                  <ListItemText
                    classes={{ primary: classes.listItemText }}
                    primary={text}
                  />
                </ListItem>
              </Tooltip>
            );
          })}
        </List>
      </Drawer>
      <Snackbar
        open={
          snackbarOpen &&
          !inActiveChat &&
          match &&
          match !== 'Not searching.' &&
          match !== 'Searching.'
        }
        autoHideDuration={6000}
        onClose={(event, reason) => {
          if (reason === 'clickaway') {
            return;
          }
          setSnackbarOpen(false);
        }}>
        <Alert
          onClose={(event, reason) => {
            if (reason === 'clickaway') {
              return;
            }
            setSnackbarOpen(false);
          }}
          severity="success">
          Found a match!
        </Alert>
      </Snackbar>
      <Snackbar
        open={timeoutSnackbar && match === 'Not searching.'}
        autoHideDuration={4000}
        onClose={(event, reason) => {
          if (reason === 'clickaway') {
            return;
          }
          setTimeoutSnackbar(false);
        }}>
        <Alert
          onClose={(event, reason) => {
            if (reason === 'clickaway') {
              return;
            }
            setTimeoutSnackbar(false);
          }}
          severity="info">
          Search timed out. Try again!
        </Alert>
      </Snackbar>
      {progress !== -1 && (
        <div
          style={{
            position: 'fixed',
            left: '0',
            bottom: '0',
            width: '100%',
          }}>
          <LinearProgress variant="determinate" value={progress} />
        </div>
      )}
      {/* To cache the search coin gif! */}
      <img hidden src="DimeAssets/searchcoin.gif" />
    </React.Fragment>
  );
}
