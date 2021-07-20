const { response } = require("express");

exports.setApp = function (app, admin) {
  app.post("/api/test", async (req, res, next) => {
    ret = { info: "working!" };
    res.status(200).json(ret);
  });

  app.post("/api/firetest", async (req, res) => {
    const snapshot = await admin.firestore().collection("users").get();

    let users = [];
    snapshot.forEach((doc) => {
      let id = doc.id;
      let data = doc.data();

      users.push({ id, ...data });
    });

    res.status(200).send(JSON.stringify(users));
  });

  app.post("/api/addmessage", async (req, res) => {
    var obj = ({
      text: formValue,
      createdAt: createdAt,
      uid: uid,
      photoURL: photoURL,
    } = req.body);

    obj.createdAt = admin.firestore.FieldValue.serverTimestamp();
    var err = "";

    try {
      const snapshot = await admin.firestore().collection("messages").add(obj);
    } catch (error) {
      err = error.message;
    }

    var ret = { error: err };
    res.status(200).json(ret);
  });

  app.post("/api/getuser", async (req, res) => {
    const user = req["currentUser"];
    console.log(user);
    var obj = ({ uid: uid } = req.body);

    if (!user) {
      responseObj = { error: "You must be logged in." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }

    if (obj.uid === "") {
      responseObj = { error: "No user specified" };

      var ret = responseObj;
      res.status(204).json(ret);
      return;
    }

    if (obj.uid !== user.user_id) {
      responseObj = { error: "Not authorized." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }

    console.log("fetched user details for " + uid);
    var err = "";
    var response = "";
    var responseObj = {};
    try {
      const doc = await admin
        .firestore()
        .collection("users")
        .doc(obj.uid)
        .get();
      if (!doc.exists) {
        err = "No user";
        responseObj = { error: err };
      } else {
        var data = doc.data();
        responseObj = {
          birth: data.birth,
          exitMessage: data.exitMessage,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          sex: data.sex,
          sexOrientation: data.sexOrientation,
          photo: data.photo,
          ageRangeMin: data.ageRangeMin,
          ageRangeMax: data.ageRangeMax,
          uid: obj.uid,
        };
      }
    } catch (error) {
      err = error.message;
      responseObj = { error: err };
    }

    var ret = responseObj;
    res.status(200).json(ret);
  });

  app.post("/api/getbasicuser", async (req, res) => {
    const user = req["currentUser"];
    if (!user) {
      responseObj = { error: "You must be logged in." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }
    var obj = ({ uid: uid } = req.body);
    console.log("fetched basic user details for " + uid);
    var err = "";
    var response = "";
    var responseObj = {};
    try {
      const doc = await admin
        .firestore()
        .collection("users")
        .doc(obj.uid)
        .get();
      if (!doc.exists) {
        err = "No user";
        responseObj = { error: err };
      } else {
        var data = doc.data();
        responseObj = {
          birth: data.birth,
          firstName: data.firstName,
          sex: data.sex,
          photo: data.photo,
        };
      }
    } catch (error) {
      err = error.message;
      responseObj = { error: err };
    }

    var ret = responseObj;
    res.status(200).json(ret);
  });

  // This retrieves the messages when users heart eachother.
  app.post("/api/getendmessages", async (req, res) => {
    const user = req["currentUser"];
    var obj = ({ user_uid: user_uid, match_uid: match_uid } = req.body);

    if (!user) {
      responseObj = { error: "You must be logged in." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }

    if (obj.user_uid === "" || obj.match_uid === "") {
      responseObj = { error: "Missing specification." };

      var ret = responseObj;
      res.status(204).json(ret);
      return;
    }

    if (obj.user_uid !== user.user_id) {
      responseObj = { error: "Not authorized." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }

    console.log(obj.user_uid, "is fetching other details for", obj.match_uid);
    var err = "";
    var response = "";
    var responseObj = {};
    try {
      var user_in_match = false;
      var match_in_user = false;

      var match_doc = await admin
        .firestore()
        .collection("users")
        .doc(obj.match_uid)
        .get();
      var user_doc = await admin
        .firestore()
        .collection("users")
        .doc(obj.user_uid)
        .get();

      if (
        match_doc.exists &&
        match_doc.data().SuccessMatch.includes(obj.user_uid)
      )
        user_in_match = true;
      if (
        user_doc.exists &&
        user_doc.data().SuccessMatch.includes(obj.match_uid)
      )
        match_in_user = true;

      if (user_in_match && match_in_user) {
        console.log(match_doc.data().exitMessage);
        responseObj = {
          matchExitMessage: match_doc.data().exitMessage,
          matchPhone: match_doc.data().phone,
        };
      } else {
        responseObj = { error: "Not authorized; missing from matches" };

        var ret = responseObj;
        res.status(200).json(ret);
        return;
      }
    } catch (error) {
      err = error.message;
      responseObj = { error: err };
    }

    var ret = responseObj;
    res.status(200).json(ret);
  });

  // This retrieves the messages when users heart eachother.
  app.post("/api/getmatches", async (req, res) => {
    const user = req["currentUser"];
    var obj = ({ uid: uid, query: query } = req.body);

    if (!user) {
      responseObj = { error: "You must be logged in." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }

    if (obj.uid !== user.user_id) {
      responseObj = { error: "Not authorized." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }

    async function getMatchesData(matches_array, query = "") {
      var jsonReturn = [];
      for (let index = 0; index < matches_array.length; index++) {
        // console.log("ran once");
        if (index === 9) break;
        var match_data = await admin
          .firestore()
          .collection("users")
          .doc(matches_array[index])
          .get();

        var obj = {
          firstName: match_data.data().firstName,
          photo: match_data.data().photo,
          phone: match_data.data().phone,
          lastName: match_data.data().lastName,
          sex: match_data.data().sex,
          sexOrientation: match_data.data().sexOrientation,
          exitMessage: match_data.data().exitMessage,
          birth: match_data.data().birth,
        };
        var fname = obj.firstName.toLowerCase();
        var lname = obj.lastName.toLowerCase();
        var flname = fname + " " + lname;
        if (
          query === "" ||
          fname.indexOf(query.toLowerCase()) >= 0 ||
          lname.indexOf(query.toLowerCase()) >= 0 ||
          flname.indexOf(query.toLowerCase()) >= 0
        ) {
          jsonReturn.push(obj);
        }
      }
      return jsonReturn;
    }

    var err = "";
    var response = "";
    var responseObj = {};
    try {
      var user_doc = await admin
        .firestore()
        .collection("users")
        .doc(obj.uid)
        .get();

      var matches_array = user_doc.data().SuccessMatch;
      var result = await getMatchesData(matches_array, query);
      var ret = result;
      res.status(200).json(ret);
      return;
    } catch (error) {
      err = error.message;
      responseObj = { error: err };
    }

    var ret = responseObj;
    // console.log(responseObj);
    res.status(200).json(ret);
  });

  app.post("/api/getemailverified", async (req, res) => {
    const user = req["currentUser"];
    var obj = ({ uid: uid } = req.body);

    if (!user) {
      responseObj = { error: "You must be logged in." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }

    if (obj.uid !== user.user_id) {
      responseObj = { error: "Not authorized." };

      var ret = responseObj;
      res.status(403).json(ret);
      return;
    }

    var err = "";
    var response = "";
    var responseObj = {};
    try {
      var user_doc = await admin.auth().getUser(obj.uid);
      var user_obj = user_doc.toJSON();

      var returning = { verified: user_obj.emailVerified };

      res.status(200).json(returning);
      return;
    } catch (error) {
      err = error.message;
      responseObj = { error: err };
    }

    var ret = responseObj;
    // console.log(responseObj);
    res.status(200).json(ret);
  });

  app.post("/api/newuser", async (req, res) => {
    const obj = ({
      email,
      sex,
      sexOrientation,
      phone,
      birth,
      exitMessage,
      userID,
      photo,
      displayName,
      initializedProfile,
      FailMatch,
      SuccessMatch,
      question1Answer,
      question2Answer,
      question3Answer,
      question4Answer,
      question5Answer,
      question6Answer,
      question7Answer,
      question8Answer,
      question9Answer,
      question10Answer,
      question11Answer,
      question12Answer,
      ageRangeMin,
      ageRangeMax,
    } = req.body);

    var err = "";

    if (!req.body.userID || req.body.userID === "") {
      res.status(400).json({ error: "malformed" });
      return;
    }
    try {
      const snapshot = await admin
        .firestore()
        .collection("users")
        .doc(userID)
        .set(obj);
    } catch (error) {
      err = error.message;
    }

    var ret = { error: err };
    res.status(200).json(ret);
  });
};
