import React, { useRef, useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

const DEFAULT_COIN_IMAGE =
  'https://firebasestorage.googleapis.com/v0/b/meet-a-dime.appspot.com/o/default_1.png?alt=media&token=23ab5b95-0214-42e3-9c54-d7811362aafc';

export default function UpdateProfile() {
  const firstRef = useRef();
  const lastRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const responseRef = useRef();
  const passwordConfirmRef = useRef();
  const firestore = firebase.firestore();
  const { currentUser, signup, logout, updatePassword, updateEmail } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [optionsState, setOptionsState] = useState('0');
  const [orientationState, setOrientationState] = useState('0');
  const [userFirstName, setFirstName] = useState('');
  const [userLastName, setLastName] = useState('');
  const [userBirth, setBirthday] = useState('');
  const [userExitMessage, setExitMessage] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  var adult = moment().subtract(18, 'years').calendar();
  console.log(adult);
  var form = moment(adult).format('YYYY-MM-DD');
  console.log(form);
  const [dateState, setDateState] = useState(form);

  const history = useHistory();
  // console.log(form)
  //console.log(optionsState)
  //console.log(dobRef.current.value)
  //console.log(sexRef.current.value)
  function dateWork(date) {
    console.log(date);

    //if (date.subtract (18, 'years'))
    setDateState(date);
    //console.log(date)
  }

  function isLegal(date, minimum_age = 18) {
    const [year, month, day] = date.split('-');
    const [y, m, d] = moment()
      .subtract(18, 'years')
      .format('yyyy-MM-DD')
      .split('-');

    var d1 = new Date(y, m, d);
    var d2 = new Date(year, month, day);
    return d2 <= d1 ? true : false;
  }

  function formatNumber(val) {
    if (!val) return val;

    const phone = val.replace(/[^\d]/g, '');
    if (phone.length < 4) return phone;

    if (phone.length < 7) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    }

    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  }

  function phoneWork(phone) {
    //console.log(phone.target.value)
    const formattedNumber = formatNumber(phone.target.value);
    setPhoneVal(formattedNumber);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    var bp = require('../Path.js');

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Passwords do not match.');
    }

    if (passwordRef.current.value.length <= 6 && passwordRef.current.value.length != "") {
      return setError('Password should be more than six characters.');
    }

    // if (dobRef.current.value === 0)
    // {
    //   return setError('Please enter a valid Date of Birth.');
    // }

    if (phoneVal.trim().length < 14) {
      return setError('Please enter a valid phone number.');
    }

    if (!isLegal(dateState))
      return setError('You must be 18 years or older');

    if (firstRef.current.value === '')
      return setError('Please input your first name');

    if (lastRef.current.value === '')
      return setError('Please input your last name');

    var orient = {
      1: 'Heterosexual',
      2: 'Homosexual',
      3: 'Bisexual',
    };

    const promises = [];
    setLoading(true);
    setError("");

    var path = 'profile';
    
    if (emailRef.current.value !== currentUser.email) {
        promises.push(updateEmail(emailRef.current.value));
        path = 'login';
    }

    if (passwordRef.current.value) {
        promises.push(updatePassword(passwordRef.current.value));
        path = 'login';
    }

    promises.push(firestore.collection('users').doc(currentUser.uid).update({firstName: firstRef.current.value.trim()}));
    promises.push(firestore.collection('users').doc(currentUser.uid).update({lastName: lastRef.current.value.trim()}));
    promises.push(firestore.collection('users').doc(currentUser.uid).update({email: emailRef.current.value}));
    promises.push(firestore.collection('users').doc(currentUser.uid).update({birth: dateState}));
    promises.push(firestore.collection('users').doc(currentUser.uid).update({sex: optionsState === '1' ? 'Male' : 'Female'}));
    promises.push(firestore.collection('users').doc(currentUser.uid).update({sexOrientation: orient[orientationState]}));
    promises.push(firestore.collection('users').doc(currentUser.uid).update({phone: phoneVal}));
    promises.push(firestore.collection('users').doc(currentUser.uid).update({exitMessage: responseRef.current.value.trim()}));

    Promise.all(promises).then(() => {
        history.push('/' + path);
    }).catch(() => {
        setError('Failed to update account');
    }).finally(() => {
        setLoading(false);
    })

    /*try {
        await firestore.collection('users').doc(currentUser.uid).update({firstName: firstRef.current.value.trim()});
        await firestore.collection('users').doc(currentUser.uid).update({lastName: lastRef.current.value.trim()});
        await firestore.collection('users').doc(currentUser.uid).update({birth: dateState});
        await firestore.collection('users').doc(currentUser.uid).update({sex: optionsState === '1' ? 'Male' : 'Female'});
        await firestore.collection('users').doc(currentUser.uid).update({sexOrientation: orient[orientationState]});
        await firestore.collection('users').doc(currentUser.uid).update({phone: phoneVal});
        await firestore.collection('users').doc(currentUser.uid).update({exitMessage: responseRef.current.value.trim()});
    } catch(error) {
        setError('Failed to update account: ' + error);
    }*/

    /*
    try {
      setError('');
      setLoading(true);
      var newUser_cred = await signup(
        emailRef.current.value.trim(),
        passwordRef.current.value
      );
      var newUser = newUser_cred.user;
      var obj = {
        firstName: firstRef.current.value.trim(),
        lastName: lastRef.current.value.trim(),
        email: newUser.email,
        sex: optionsState === '1' ? 'Male' : 'Female',
        sexOrientation: orient[orientationState],
        birth: dateState,
        phone: phoneVal,
        exitMessage: responseRef.current.value.trim(),
        userID: newUser.uid,
        photo: DEFAULT_COIN_IMAGE,
        displayName: newUser.displayName === null ? '' : newUser.displayName,
        initializedProfile: 0,
        FailMatch: [],
        SuccessMatch: [],
      };

      var config = {
        method: 'post',
        url: bp.buildPath('api/newuser'),
        headers: {
          'Content-Type': 'application/json',
        },
        data: obj,
      };

      var response = await axios(config);
      // var parsedRes = JSON.parse(response);
      if (response.data.error === '') {
        setLoading(false);
        history.push('/verify');
      } else {
        setError('Axios error');
      }
    } catch (error) {
      setError('Failed to create an account: ' + error);
      try {
        await logout();
        localStorage.removeItem('user_data');
      } catch (err) {
        setError('Secondary logout error : ' + err);
      }
      setLoading(false);
    }
    */
  }

  async function fetchUserData() {
    console.log('ran');
    var snapshot = await firestore.collection('users').get();
    snapshot.forEach((doc) => {
      if (doc.data().userID === currentUser.uid) {
        setDateState(doc.data().birth);  
        setFirstName(doc.data().firstName);
        setLastName(doc.data().lastName);
        setPhoneVal(doc.data().phone);
        setExitMessage(doc.data().exitMessage);
        setOptionsState(doc.data().sex == "Male" ? "1" : "2");
        var userOrientation = doc.data().sexOrientation;
        setOrientationState(userOrientation == "Heterosexual" ? "1" : (userOrientation == "Homosexual" ? "2" : "3"));
        

        // Set some items into local storage for easy reference later
        //   its only 5 items right now just so it matches the other
        //   references on the Home.js page, but we can add all for sure

        // Ideally this should also get set when a user changes it
        // on this page as well.
        localStorage.setItem(
          'user_data',
          JSON.stringify({
            birth: userBirth,
            exitMessage: userExitMessage,
            firstName: userFirstName,
            sex: optionsState,
            sexOrientation: orientationState,
          })
        );
      }
    });
  }

  useEffect(() => {
    fetchUserData();
  }, []);

  function redirectToProfile() {
      history.push('/profile');
  }

  return (
    <>
      <Card>
        <Card.Body>
          <h2 className="text-center mb-3">Update Profile</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group id="firstName">
              <Form.Label>First name:</Form.Label>
              <Form.Control type="text" ref={firstRef} defaultValue={userFirstName}/>
            </Form.Group>
            <Form.Group id="lastName">
              <Form.Label>Last name:</Form.Label>
              <Form.Control type="text" ref={lastRef} defaultValue={userLastName}/>
              <Form.Text className="text-muted">
                Your last name will stay private
              </Form.Text>
            </Form.Group>
            <Form.Group id="email">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" ref={emailRef} required 
              defaultValue={currentUser.email}/>
              <Form.Text className="text-muted">
                We will never share your email with anyone.
              </Form.Text>
            </Form.Group>
            <Form.Group id="password">
              <Form.Label>New password</Form.Label>
              <Form.Control type="password" ref={passwordRef} 
              placeholder="Leave blank to keep the same."/>
            </Form.Group>
            <Form.Group id="password-confirm">
              <Form.Label>New password confirmation</Form.Label>
              <Form.Control type="password" ref={passwordConfirmRef} 
              placeholder="Leave blank to keep the same."/>
            </Form.Group>
            <Form.Group id="dob">
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control
                type="date"
                value={dateState}
                onChange={(e) => dateWork(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                You must be 18+ years
              </Form.Text>
            </Form.Group>
            <Form.Row id="sex">
              <Form.Label>Sex</Form.Label>
              <Form.Control
                as="select"
                value={optionsState}
                onChange={(e) => setOptionsState(e.target.value)}
                required>
                <option value="1">Male</option>
                <option value="2">Female</option>
              </Form.Control>
            </Form.Row>
            <Form.Row id="sexualOrientation">
              <Form.Label>Sexual Orientation</Form.Label>
              <Form.Control
                as="select"
                value={orientationState}
                onChange={(e) => setOrientationState(e.target.value)}
                required>
                <option value="1">Heterosexual</option>
                <option value="2">Homosexual</option>
                <option value="3">Bisexual</option>
              </Form.Control>
            </Form.Row>
            <Form.Group id="customResponse">
              <Form.Label>Custom end of chat response:</Form.Label>
              <Form.Control type="text" ref={responseRef} defaultValue={userExitMessage}/>
              <Form.Text className="text-muted">
                Users will see this response at the end of a chat. This can be
                changed later...
              </Form.Text>
            </Form.Group>
            <Form.Group id="phoneGroup">
              <Form.Label>Phone number:</Form.Label>
              <Form.Control
                type="tel"
                value={phoneVal}
                onChange={(e) => phoneWork(e)}
                required
              />
            </Form.Group>
            <Button disabled={loading} className="w-100 mt-2" type="submit">
              Save Changes
            </Button>
            <Button className="w-100 mt-2">
                Delete Account
            </Button>
          </Form>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        <Link to="/profile">Cancel</Link>
      </div>
    </>
  );
}