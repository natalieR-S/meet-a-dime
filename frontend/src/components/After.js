import React, { useState, useEffect } from 'react';
// import { Button, Alert, Container, Form } from 'react-bootstrap';
import { Alert } from '@material-ui/lab';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import ReactRoundedImage from 'react-rounded-image';
// import Button from '@material-ui/core/Button';
import { useAuth } from '../contexts/AuthContext';
import { useHistory, useLocation } from 'react-router-dom';
// import { io } from 'socket.io-client';
import axios from 'axios';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import moment from 'moment';
import IconButton from '@material-ui/core/IconButton';
// import LinearProgress from '@material-ui/core/LinearProgress';
import { Navbar } from 'react-bootstrap';

import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import MenuIcon from '@material-ui/icons/Menu';
import PhoneIphoneIcon from '@material-ui/icons/PhoneIphone';
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HomeIcon from '@material-ui/icons/Home';
import Collapse from '@material-ui/core/Collapse';
import Zoom from '@material-ui/core/Zoom';
import Slide from '@material-ui/core/Slide';
import CloseIcon from '@material-ui/icons/Close';
import Grow from '@material-ui/core/Grow';
// import ExitToAppIcon from '@material-ui/icons/ExitToApp';

var bp = require('../Path.js');
// const firestore = firebase.firestore();

// Drawer
const drawerWidth = 300;

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

export default function After() {
  // Drawer
  const classes = useStyles();
  const itemsList = [
    {
      text: 'Home',
      icon: <HomeIcon style={{ color: '#e64398' }} />,
      onClick: redirectToHome,
    },
  ];

  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  // const [switching, setSwitching] = useState(false);

  // Prevent some prompt issues.

  // const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const [match_age, setMatchAge] = useState('');
  const [match_name, setMatchName] = useState('');
  const [match_sex, setMatchSex] = useState('');
  const [match_photo, setMatchPhoto] = useState('');
  const [match_id, setMatchID] = useState('');
  const [pageType, setPageType] = useState('');
  const [match_exitMessage, setExitMessage] = useState('');
  const [match_phoneNumber, setPhoneNumber] = useState('');
  const firestore = firebase.firestore();
  const [alertOpen, setAlertOpen] = useState(true);

  useLocation();
  // Gets the passed in match id from the link in the home page
  // timeout_5 is passed in from the home link. it prevents removing the match document in the background.

  const history = useHistory();

  // Redirect users if they are not verified.
  if (!currentUser.emailVerified) {
    history.push('/verify');
  }

  // Fetch the matches' name, birth, sex when page loads.
  async function fetchMatchInfo(id_of_match) {
    try {
      const token = currentUser && (await currentUser.getIdToken());
      var config = {
        method: 'post',
        url: bp.buildPath('api/getbasicuser'),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: { uid: id_of_match },
      };
      var response = await axios(config);
      // console.log(response.data);
      console.log('fetched data!');
      setMatchAge(moment().diff(response.data.birth, 'years'));
      setMatchName(response.data.firstName);
      setMatchSex(response.data.sex);
      setMatchPhoto(response.data.photo);
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchMatchOnMatchMade() {
    try {
      const token = currentUser && (await currentUser.getIdToken());
      // console.log(token);
      var config = {
        method: 'post',
        url: bp.buildPath('api/getendmessages'),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: {
          user_uid: currentUser.uid,
          match_uid: history.location.state.state.match_id,
        },
      };
      var response = await axios(config);

      // Recursion! Keep calling until it resolves.
      if (
        response &&
        response.data &&
        response.data.error === 'Not authorized; missing from matches'
      ) {
        setTimeout(() => {
          fetchMatchOnMatchMade();
        }, 500);
      }

      setExitMessage(response.data.matchExitMessage);
      setPhoneNumber(response.data.matchPhone);
      console.log(response.data.matchExitMessage);
      console.log(response.data.matchPhone);
    } catch (error) {
      console.log(error);
    }
  }

  // this effect only runs once.
  useEffect(() => {
    if (
      history &&
      history.location &&
      history.location.state &&
      history.location.state.state &&
      history.location.state.state.match_id
    ) {
      var mtch_id = history.location.state.state.match_id;
      console.log(mtch_id);
      fetchMatchInfo(mtch_id);
      setMatchID(mtch_id);
      setPageType(history.location.state.state.type);
      console.log(history.location.state.state.type);
    } else {
      console.log('not from chat');
      redirectToHome();
      return;
    }

    // So they say they made a match. Lets verify this!
    if (history.location.state.state.type === 'match_made') {
      fetchMatchOnMatchMade();
    }

    console.log(currentUser.getIdToken());
    localStorage.removeItem('chatExpiry');
    document.body.style.backgroundColor = 'white';

    // Clear the docs on the after screen as well.
    async function purgeOld() {
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
    }
    // call the function that was just defined here.
    purgeOld();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function redirectToHome() {
    history.push('/');
    // window.location.reload(); CHANGED_NOW
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
                  style={{ cursor: 'pointer' }}
                  src="/DimeAssets/headerlogo.png"
                  width="250px"
                  height="100%"
                  className="d-inline-block align-top"
                  alt="logo"
                  href="home"
                  onClick={redirectToHome}
                />
              </Navbar.Brand>
            </Navbar>
          </Typography>

          <IconButton
            color="default"
            aria-label="open drawer"
            edge="end"
            onClick={handleDrawerOpen}
            className={clsx(open && classes.hide)}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Grid
        container
        direction="column"
        justifyContent="flex-end"
        alignItems="center"
        className="match-photo-container"
        style={{
          marginTop: '100px',
        }}>
        {/* {error && <Alert action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setAlertOpen(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          } variant="filled" severity="error">{error}</Alert>} */}
        <Collapse in={alertOpen} style={{ marginBottom: '10px' }}>
          {pageType && pageType === 'match_abandoned' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="info">
              {'Your match left 😥'}
            </Alert>
          )}
          {pageType && pageType === 'user_abandoned' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="info">
              {"Sorry it didn't go well.. Keep flipping the coin 😊"}
            </Alert>
          )}
          {pageType && pageType === 'match_didnt_go_well' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="info">
              {'Awkward, the other user said no. Keep looking 😌'}
            </Alert>
          )}
          {pageType && pageType === 'user_didnt_go_well' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="info">
              {"Sorry it didn't go well.. Keep looking 😊"}
            </Alert>
          )}
          {pageType && pageType === 'match_timedout' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="info">
              {'Your match timed out. You can match again in the future ⌛'}
            </Alert>
          )}
          {pageType && pageType === 'match_made' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="info">
              {"You've matched with a Dime 🥰"}
            </Alert>
          )}
          {pageType && pageType === 'timeout' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="info">
              {'You timed out. You can match again in the future ⌛'}
            </Alert>
          )}
          {pageType && pageType === 'error' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="error">
              {'Something went wrong ⚠️'}
            </Alert>
          )}
          {pageType && pageType === 'extended_timeout' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="info">
              {
                'Timed out. You said yes, so you can match again in the future 🕓'
              }
            </Alert>
          )}
          {pageType && pageType === 'user_reported' && (
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlertOpen(false);
                  }}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              variant="filled"
              severity="success">
              {
                'Other user was reported. This report is secret and they were not alerted 🚫'
              }
            </Alert>
          )}
        </Collapse>
        <Collapse in={match_photo !== ''}>
          <>
            {match_photo !== '' ? (
              <ReactRoundedImage
                imageHeight="150"
                imageWidth="150"
                image={match_photo}
                id="photo"
                roundedSize="13"
                borderRadius="150"
                alt="My Profile Pic"
                hoverColor="pink"
                style={{
                  marginTop: '25px',
                }}
              />
            ) : null}
            <h2 className="text-center mb-3" style={{ color: '#E64398' }}>
              {match_name}
            </h2>
          </>
        </Collapse>
        <Zoom direction="up" in={match_phoneNumber !== ''}>
          <div id="made-match-div">
            {/* {pageType === 'match_made' && (
            <h3 style={{ color: '#e4a', fontSize: 'calc(1rem + .6vw)' }}>
              Congratulations!
            </h3>
          )} */}
            {pageType === 'match_made' && (
              <h3 style={{ color: '#e4a' }}>
                <PhoneIphoneIcon style={{ color: '#e4a' }} />
                {match_phoneNumber}
              </h3>
            )}
            {pageType === 'match_made' && (
              <h3 style={{ color: '#e4a' }}>
                <ChatBubbleOutlineIcon style={{ color: '#e4a' }} />{' '}
                {match_exitMessage}
              </h3>
            )}
          </div>
        </Zoom>
      </Grid>
      {/* <Button variant="contained" color="primary" onClick={redirectToHome}>
        Home
      </Button> */}
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
            const { text, icon, onClick } = item;
            return (
              <ListItem
                className="drawer-item"
                button
                key={text}
                onClick={onClick}>
                {icon && <ListItemIcon>{icon}</ListItemIcon>}
                <ListItemText
                  classes={{ primary: classes.listItemText }}
                  primary={text}
                />
              </ListItem>
            );
          })}
        </List>
      </Drawer>
    </React.Fragment>
  );
}
