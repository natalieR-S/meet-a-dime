import React, { useRef, useState } from 'react';
import { Form, Button, Navbar } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from '@material-ui/lab';
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { Formik } from 'formik';
import * as yup from 'yup';

const DEFAULT_COIN_IMAGE =
  'https://firebasestorage.googleapis.com/v0/b/meet-a-dime.appspot.com/o/default_1.png?alt=media&token=23ab5b95-0214-42e3-9c54-d7811362aafc';

moment.suppressDeprecationWarnings = true;

export default function SignUp() {
  const firstRef = useRef();
  const lastRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const responseRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup, logout } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [optionsState, setOptionsState] = useState('0');
  const [orientationState, setOrientationState] = useState('0');
  const [phoneVal, setPhoneVal] = useState('');
  var adult = moment().subtract(18, 'years').calendar();
  const [emailInUse, setEmailInUse] = useState(false);

  var form = moment(adult).format('YYYY-MM-DD');
  const [dateState, setDateState] = useState(form);
  const [value, setValue] = useState([
    18,
    Math.min(moment().diff(dateState, 'years') + 6, 72),
  ]);

  const handleChangeValue = (event, newValue) => {
    setValue(newValue);
    // console.log(newValue);
  };

  const schema = yup.object().shape({
    firstName: yup.string().required('First name is required.').trim(),
    lastName: yup.string().required('Last name is required.').trim(),
    email: yup.string().email('An email is required.').required().trim(),
    password: yup.string().required('You must have a password.').min(7).trim(),
    passwordVerify: yup
      .string()
      .required('You must have a password.')
      .min(7)
      .trim()
      .when('password', {
        is: (password) => (password && password.length > 0 ? true : false),
        then: yup
          .string()
          .oneOf([yup.ref('password')], "Password doesn't match"),
      }),
    dateOfBirth: yup.string().required().trim(),
    sex: yup.string().required().trim('You must choose a sex.'),
    sexOrientation: yup
      .string()
      .required('You must choose a sex orientation.')
      .trim(),
    phone: yup
      .string()
      .required()
      .trim('You need to list a phone number.')
      .length(14),
    endOfChat: yup.string().max(280),
  });

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
    // console.log(d2 <= d1 ? true : false);
    return d2 <= d1 ? true : false;
  }

  function handleErrors(error) {
    if (error === 'auth/email-already-in-use') {
      setError('Email is already in use.');
      setEmailInUse(true);
    } else {
      setError(error);
    }
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
    return formattedNumber;
  }

  //counts the number of characters a user is typing for personal questions
  //they get a live count that turns red if they are over the character limit
  //NOTE - Add at a later date
  // var maxAnswerLength = 280;

  async function handleSubmitForm() {
    var bp = require('../Path.js');

    //scroll to top of page toi see error messages
    function scrollToTop() {
      window.scrollTo(0, 0);
    }

    var orient = {
      1: 'Heterosexual',
      2: 'Homosexual',
      3: 'Bisexual',
      4: 'Bisexual',
      5: 'Bisexual',
    };
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
        ageRangeMin: value[0],
        ageRangeMax: value[1],
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
        setEmailInUse(false);
        setLoading(false);
        history.push('/verify');
      } else {
        setError('Axios error');
      }
    } catch (error) {
      // setError('Failed to create an account: ' + error.code);
      handleErrors(error.code === undefined ? error : error.code);
      scrollToTop();
      try {
        await logout();
        localStorage.removeItem('user_data');
      } catch (err) {
        setError('Secondary logout error : ' + err);
      }
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar bg="transparent">
        <Navbar.Brand href="login">
          <img
            src="/DimeAssets/headerlogo.png"
            className="d-inline-block align-top header-logo-signup"
            alt="Dimelogo"
          />
        </Navbar.Brand>
      </Navbar>

      <Grid
        container
        direction="row"
        justifyContent="space-evenly"
        alignItems="flex-start"
        spacing={1}>
        <Grid item xs={10} sm={5} md={5} lg={5} xl={5}>
          <img
            id="signUpDimeImage"
            className="img-fluid"
            alt="signup"
            src="DimeAssets/coinsignup.png"
          />
        </Grid>
        <Grid item xs={10} sm={6} md={5} lg={5} xl={5}>
          {/* <Card.Body> */}
          <h2 className="text-center mb-3" style={{ color: '#929292' }}>
            Create an Account
          </h2>
          {error && <Alert severity="error">{error}</Alert>}

          <Formik
            validationSchema={schema}
            onSubmit={(values) => {
              if (isLegal(values.dateOfBirth)) handleSubmitForm();
            }}
            initialValues={{
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              passwordVerify: '',
              dateOfBirth: form,
              sex: '',
              sexOrientation: '',
              phone: '',
              endOfChat: '',
            }}>
            {({
              handleSubmit,
              handleChange,
              setFieldValue,
              handleBlur,
              values,
              touched,
              isValid,
              errors,
            }) => (
              <Form noValidate onSubmit={handleSubmit}>
                <Form.Group
                  controlId="validationFormik01"
                  id="firstName"
                  className="mb-2">
                  <Form.Control
                    type="text"
                    ref={firstRef}
                    value={values.firstName}
                    onChange={handleChange}
                    name="firstName"
                    isValid={touched.firstName && !errors.firstName}
                    isInvalid={touched.firstName && errors.firstName}
                    placeholder="First Name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.firstName}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group id="lastName" className="mb-2">
                  <Form.Control
                    type="text"
                    value={values.lastName}
                    name="lastName"
                    onChange={handleChange}
                    isValid={touched.lastName && !errors.lastName}
                    isInvalid={touched.lastName && errors.lastName}
                    ref={lastRef}
                    placeholder="Last Name"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.lastName}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Your last name will stay private
                  </Form.Text>
                </Form.Group>
                <Form.Group id="email" className="mb-2">
                  <Form.Control
                    type="email"
                    ref={emailRef}
                    value={values.email}
                    name="email"
                    onChange={handleChange}
                    isValid={touched.email && !errors.email}
                    isInvalid={(touched.email && errors.email) || emailInUse}
                    placeholder="Email"
                  />

                  <Form.Text className="text-muted">
                    We will never share your email with anyone.
                  </Form.Text>
                </Form.Group>
                <Form.Group id="password" className="mb-2">
                  <Form.Control
                    type="password"
                    ref={passwordRef}
                    value={values.password}
                    name="password"
                    onChange={handleChange}
                    isValid={touched.password && !errors.password}
                    isInvalid={touched.password && errors.password}
                    placeholder="Password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group id="password-confirm" className="mb-2">
                  <Form.Control
                    type="password"
                    ref={passwordConfirmRef}
                    value={values.passwordVerify}
                    name="passwordVerify"
                    onChange={handleChange}
                    isValid={touched.passwordVerify && !errors.passwordVerify}
                    isInvalid={touched.passwordVerify && errors.passwordVerify}
                    placeholder="Password Confirmation"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.passwordVerify}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group id="phoneGroup" className="mb-2">
                  <Form.Control
                    type="tel"
                    value={values.phone}
                    onChange={(e) => {
                      var formatted = phoneWork(e);
                      setFieldValue('phone', formatted);
                      // handleChange(e);
                    }}
                    name="phone"
                    isValid={touched.phone && !errors.phone}
                    isInvalid={touched.phone && errors.phone}
                    placeholder="Phone Number"
                  />
                  <Form.Control.Feedback type="invalid">
                    Phone number is invalid.
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group id="dob" className="mb-2">
                  <Form.Control
                    type="date"
                    // value={dateState}
                    // onChange={(e) => dateWork(e.target.value)}
                    name="dateOfBirth"
                    value={values.dateOfBirth}
                    onChange={(e) => {
                      dateWork(e.target.value);
                      handleChange(e);
                    }}
                    isValid={
                      touched.dateOfBirth &&
                      !errors.dateOfBirth &&
                      isLegal(values.dateOfBirth)
                    }
                    isInvalid={
                      touched.dateOfBirth &&
                      (errors.dateOfBirth || !isLegal(dateState))
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    You must be 18 years or older to use Meet a Dime.
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Row id="sex" className="mb-2">
                  <Form.Control
                    as="select"
                    // value={optionsState}
                    value={values.sex}
                    onChange={(e) => {
                      setOptionsState(e.target.value);
                      handleChange(e);
                    }}
                    name="sex"
                    isValid={touched.sex && !errors.sex}
                    isInvalid={
                      touched.sex && (errors.sex || values.sex === '0')
                    }>
                    <option value="0">Choose your sex...</option>
                    <option value="1">Male</option>
                    <option value="2">Female</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.sex || 'You must choose a sex.'}
                  </Form.Control.Feedback>
                </Form.Row>
                <Form.Row id="sexualOrientation" className="mb-2">
                  <Form.Control
                    as="select"
                    // value={orientationState}
                    value={values.sexOrientation}
                    onChange={(e) => {
                      setOrientationState(e.target.value);
                      handleChange(e);
                    }}
                    name="sexOrientation"
                    isValid={touched.sexOrientation && !errors.sexOrientation}
                    isInvalid={
                      touched.sexOrientation &&
                      (errors.sexOrientation || values.sexOrientation === '0')
                    }>
                    <option value="0">Choose your sexual orientation...</option>
                    <option value="1">Straight</option>
                    <option value="2">Gay/Lesbian</option>
                    <option value="3">Bisexual</option>
                    <option value="4">Questioning</option>
                    <option value="5">Other</option>
                  </Form.Control>
                  <Form.Control.Feedback type="invalid">
                    {errors.sexOrientation ||
                      'You must choose a sex orientation.'}
                  </Form.Control.Feedback>
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
                    onChange={handleChangeValue}
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
                  <Form.Control
                    type="text"
                    ref={responseRef}
                    value={values.endOfChat}
                    name="endOfChat"
                    onChange={handleChange}
                    isValid={touched.endOfChat && !errors.endOfChat}
                    isInvalid={touched.endOfChat && errors.endOfChat}
                    placeholder="End of Chat Response"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.endOfChat && 'Response is too long!'}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Users will see this response at the end of a chat. This can
                    be changed later...
                  </Form.Text>
                </Form.Group>

                <Button disabled={loading} className="w-100 mt-2" type="submit">
                  Register
                </Button>
              </Form>
            )}
          </Formik>
          {/* </Card.Body> */}

          <div className="w-100 text-center mt-2">
            Already have an account? <Link to="/login">Log In</Link>
          </div>
        </Grid>
      </Grid>
    </>
  );
}
