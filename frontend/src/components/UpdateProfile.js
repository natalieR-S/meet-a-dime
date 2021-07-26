import React, { useRef, useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Link, useHistory } from 'react-router-dom';
import LinearProgress from '@material-ui/core/LinearProgress';

// import axios from 'axios';
import moment from 'moment';
import firebase from 'firebase/app';
import 'firebase/auth';
import Slider from '@material-ui/core/Slider';
import 'firebase/firestore';
import 'firebase/storage';

// const DEFAULT_COIN_IMAGE =
//   'https://firebasestorage.googleapis.com/v0/b/meet-a-dime.appspot.com/o/default_1.png?alt=media&token=23ab5b95-0214-42e3-9c54-d7811362aafc';

function scrollToTop() {
  window.scrollTo(0, 0);
}

export default function UpdateProfile() {
  const firstRef = useRef();
  const lastRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const responseRef = useRef();
  const passwordConfirmRef = useRef();
  const [saving, setSaving] = useState(false);
  const firestore = firebase.firestore();
  const { currentUser, updatePassword, updateEmail, deleteUser } = useAuth();
  const [error, setError] = useState('');
  const [passError, setPasswordError] = useState('');
  const [passChange, setPassChange] = useState('');
  const [loading, setLoading] = useState('');
  const [optionsState, setOptionsState] = useState('0');
  const [orientationState, setOrientationState] = useState('0');
  const [userFirstName, setFirstName] = useState('');
  const [userLastName, setLastName] = useState('');
  // const [userBirth, setBirthday] = useState('');
  const [userExitMessage, setExitMessage] = useState('');
  const [phoneVal, setPhoneVal] = useState('');
  var adult = moment().subtract(18, 'years').calendar();
  // console.log(adult);
  var form = moment(adult).format('YYYY-MM-DD');
  // console.log(form);
  const [dateState, setDateState] = useState(form);
  const [value, setValue] = useState([
    18,
    Math.min(moment().diff(dateState, 'years') + 6, 72),
  ]);
  // Changes slider values
  const handleChange = (event, newValue) => {
    setValue(newValue);
    // console.log(newValue);
  };

  const history = useHistory();
  // console.log(form)
  //console.log(optionsState)
  //console.log(dobRef.current.value)
  //console.log(sexRef.current.value)
  function dateWork(date) {
    try {
      // console.log(date);

      //if (date.subtract (18, 'years'))
      setDateState(date);
      setValue([
        Math.max(moment().diff(date, 'years') - 6, 18),
        Math.min(moment().diff(date, 'years') + 6, 72),
      ]);
      //console.log(date)
    } catch (error) {}
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

  async function handleDelete(e) {
    if (
      window.confirm(
        'Are you sure you want to delete your account? This action is permanent'
      )
    ) {
      try {
        await firestore.collection('users').doc(currentUser.uid).delete();
        await deleteUser();
      } catch (error) {
        scrollToTop();
        return setError('Failed to delete account' + error);
      }
      history.push('/login');
    } else {
      //dont do anything
    }
  }

  async function handlePasswordUpdate(e) {
    setPasswordError('');
    setPassChange('');
    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      setPassChange('');

      return setPasswordError('Passwords do not match.');
    }

    if (
      passwordRef.current.value.length <= 6 &&
      passwordRef.current.value.length !== ''
    ) {
      setPassChange('');

      return setPasswordError('Password should be more than six characters.');
    }

    if (passwordRef.current.value) {
      try {
        await updatePassword(passwordRef.current.value);
        return setPassChange('Password successfully changed!');
      } catch (error) {
        setPasswordError(error);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // var bp = require('../Path.js');

    // if (dobRef.current.value === 0)
    // {
    //   return setError('Please enter a valid Date of Birth.');
    // }

    if (phoneVal.trim().length < 14) {
      scrollToTop();
      return setError('Please enter a valid phone number.');
    }

    if (!isLegal(dateState)) {
      scrollToTop();
      return setError('You must be 18 years or older');
    }

    if (firstRef.current.value === '') {
      scrollToTop();
      return setError('Please input your first name');
    }

    if (lastRef.current.value === '') {
      scrollToTop();
      return setError('Please input your last name');
    }

    var orient = {
      1: 'Heterosexual',
      2: 'Homosexual',
      3: 'Bisexual',
      4: 'Bisexual',
    };

    var path = '/profile';
    setLoading(true);
    setError('');

    try {
      if (emailRef.current.value !== currentUser.email) {
        path = '/login';
        updateEmail(emailRef.current.value);
      }

      setSaving(true);
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ firstName: firstRef.current.value.trim() });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ lastName: lastRef.current.value.trim() });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ email: emailRef.current.value });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ birth: dateState });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ sex: optionsState === '1' ? 'Male' : 'Female' });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ sexOrientation: orient[orientationState] });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ phone: phoneVal });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ exitMessage: responseRef.current.value.trim() });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ ageRangeMin: value[0] });
      await firestore
        .collection('users')
        .doc(currentUser.uid)
        .update({ ageRangeMax: value[1] });
    } catch (error) {
      setError('Failed to update account: ' + error);
      scrollToTop();
      setSaving(false);
    } finally {
      setLoading(false);
      setSaving(false);
      history.push(path);
    }

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
    // console.log('ran');
    var snapshot = await firestore.collection('users').get();
    snapshot.forEach((doc) => {
      if (doc.data().userID === currentUser.uid) {
        setDateState(doc.data().birth);
        setFirstName(doc.data().firstName);
        setLastName(doc.data().lastName);
        setPhoneVal(doc.data().phone);
        setExitMessage(doc.data().exitMessage);
        setOptionsState(doc.data().sex === 'Male' ? '1' : '2');
        if (isNaN(doc.data().ageRangeMin)) {
          console.log('NAN FOR NOW');
          setValue([
            Math.max(moment().diff(doc.data().birth, 'years') - 6, 18),
            Math.min(moment().diff(doc.data().birth, 'years') + 6, 72),
          ]);
        } else {
          setValue([doc.data().ageRangeMin, doc.data().ageRangeMax]);
        }
        var userOrientation = doc.data().sexOrientation;
        setOrientationState(
          userOrientation === 'Heterosexual'
            ? '1'
            : userOrientation === 'Homosexual'
            ? '2'
            : '3'
        );

        // Set some items into local storage for easy reference later
        //   its only 5 items right now just so it matches the other
        //   references on the Home.js page, but we can add all for sure

        // Ideally this should also get set when a user changes it
        // on this page as well.
        // localStorage.setItem(
        //   'user_data',
        //   JSON.stringify({
        //     birth: userBirth,
        //     exitMessage: userExitMessage,
        //     firstName: userFirstName,
        //     sex: optionsState,
        //     sexOrientation: orientationState,
        //   })
        // );
      }
    });
  }

  useEffect(() => {
    scrollToTop();
    fetchUserData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // function redirectToProfile() {
  //   history.push('/profile');
  // }

  return (
    <>
      <Card>
        <Card.Body>
          <h1 className="header text-center mb-3">Update Profile</h1>
          {error && <Alert variant="danger">{error}</Alert>}

          <Container>
            <Form onSubmit={handleSubmit}>
              <Form.Group id="firstName">
                <Form.Label>First name:</Form.Label>
                <Form.Control
                  type="text"
                  ref={firstRef}
                  defaultValue={userFirstName}
                />
              </Form.Group>
              <Form.Group id="lastName">
                <Form.Label>Last name:</Form.Label>
                <Form.Control
                  type="text"
                  ref={lastRef}
                  defaultValue={userLastName}
                />
                <Form.Text className="text-muted">
                  Your last name will stay private
                </Form.Text>
              </Form.Group>
              <Form.Group id="email">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  ref={emailRef}
                  required
                  defaultValue={currentUser.email}
                />
                <Form.Text className="text-muted">
                  Changing your email will require re-verification ⚠️
                </Form.Text>
              </Form.Group>
              <Form.Group id="dob">
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control
                  type="date"
                  disabled
                  value={dateState}
                  onChange={(e) => dateWork(e.target.value)}
                  required
                />
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
                  <option value="1">Straight</option>
                  <option value="2">Gay/Lesbian</option>
                  <option value="3">Bisexual</option>
                  <option value="4">Other</option>
                </Form.Control>
              </Form.Row>
              {orientationState === '4' && (
                <Form.Group id="customGender">
                  <Form.Control
                    type="text"
                    placeholder="Input a sexual orientation"
                  />
                </Form.Group>
              )}
              <Form.Row>
                <Form.Label className="text-muted">
                  Select an age range
                </Form.Label>
                <Slider
                  value={value}
                  onChange={handleChange}
                  valueLabelDisplay="auto"
                  aria-labelledby="range-slider"
                  min={18}
                  max={72}
                  marks={[
                    {
                      value: 18,
                      label: '18',
                    },
                    {
                      value: 24,
                      label: '24',
                    },
                    {
                      value: 36,
                      label: '36',
                    },
                    {
                      value: 48,
                      label: '48',
                    },
                    {
                      value: 60,
                      label: '60',
                    },
                    {
                      value: 72,
                      label: '72',
                    },
                  ]}
                />
              </Form.Row>
              <Form.Group id="customResponse">
                <Form.Label>Custom end of chat response:</Form.Label>
                <Form.Control
                  type="text"
                  ref={responseRef}
                  defaultValue={userExitMessage}
                />
                <Form.Text className="text-muted">
                  Users will see this response at the end of a chat if all goes
                  well.
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
            </Form>
            <hr></hr>
            <Form className="change-profile-form">
              {passChange && <Alert variant="success">{passChange}</Alert>}
              {passError && <Alert variant="danger">{passError}</Alert>}
              <Form.Group id="password">
                <Form.Label>New password</Form.Label>
                <Form.Control
                  type="password"
                  ref={passwordRef}
                  placeholder="Leave blank to keep the same."
                />
              </Form.Group>
              <Form.Group id="password-confirm">
                <Form.Label>New password confirmation</Form.Label>
                <Form.Control
                  type="password"
                  ref={passwordConfirmRef}
                  placeholder="Leave blank to keep the same."
                />
              </Form.Group>
              <Button className="w-100 mt-3" onClick={handlePasswordUpdate}>
                Change Password
              </Button>
            </Form>

            <hr></hr>
            <Button
              className="btn-abandon w-100 mt-2"
              id="delete-button"
              onClick={handleDelete}>
              Delete Account
            </Button>
          </Container>
        </Card.Body>
      </Card>
      <div className="w-100 text-center mt-2">
        <Link to="/profile">Cancel</Link>
      </div>
      {saving && (
        <div
          style={{
            position: 'fixed',
            left: '0',
            bottom: '0',
            width: '100%',
          }}>
          <LinearProgress variant="indeterminate" />
        </div>
      )}
    </>
  );
}
