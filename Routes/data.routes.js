const crypto = require("crypto");
const { json } = require('body-parser')


const dataRoutes = (app, fs) => {
  // variables
  const columndataPath = './Data/column.json'; 
  const rowdataPath = './Data/row.json';
  // refactored helper methods
  const readFile = (
    callback,
    returnJson = false,
    filePath,
    encoding = 'utf8'
  ) => {
    fs.readFile(filePath, encoding, (err, data) => {
      if (err) {
        throw err;
      }
      callback(returnJson ? JSON.parse(data) : data);
    });
  };

  const writeFile = (
    fileData,
    callback,
    filePath,
    encoding = 'utf8'
  ) => {
    fs.writeFile(filePath, fileData, encoding, err => {
      if (err) {
        throw err;
      }

      callback();
    });
  };


  //#region  Rows

  // READ
  app.get('/rows', (req, res) => {
    fs.readFile(rowdataPath, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      res.send(JSON.parse(data));
    });
  });


  // CREATE
  app.post('/add-rows', (req, res) => {
    readFile(data => {
      // Note: this needs to be more robust for production use. 
      // e.g. use a UUID or some kind of GUID for a unique ID value.
      // add the new column
      let newuniqueId = randomId();
      if (req.body.action == "addnext") {
        addNextItemIntoArray(data, req.body.uniqueId, newuniqueId);
      }
      else if (req.body.action == "addchild") {
        addNextChildItemIntoArray(data, req.body.uniqueId, newuniqueId);
      }
      writeFile(JSON.stringify(data, null, 2), () => {
        res.status(200).send({ status: true, id: newuniqueId });
      }, rowdataPath);
    }, true, rowdataPath);
  });

  function addNextItemIntoArray(arr, uniqueId, newuniqueId) {
    var index = arr.findIndex(x => x.uniqueId == uniqueId);
    if (index != -1) {
      arr.splice(index + 1, 0, { uniqueId: newuniqueId })
      return true;
    }
    else {
      arr.forEach(x => {
        if (Array.isArray(x.subtasks)) {
          let val = addNextItemIntoArray(x.subtasks, uniqueId, newuniqueId)
          if (val) {
            return true;
          }
        }
      })
    }
  }
  function addNextChildItemIntoArray(arr, uniqueId, newuniqueId) {
    var index = arr.findIndex(x => x.uniqueId == uniqueId);
    if (index != -1) {
      if (Array.isArray(arr[index].subtasks)) {
        arr[index].subtasks.push({ uniqueId: newuniqueId })
      }
      else {
        arr[index].subtasks = [{ uniqueId: newuniqueId }];
      }

      return true;
    }
    else {
      arr.forEach(x => {
        if (Array.isArray(x.subtasks)) {
          let val = addNextChildItemIntoArray(x.subtasks, uniqueId, newuniqueId)
          if (val) {
            return true;
          }
        }
      })
    }
  }
  function randomId() {
    return crypto.randomBytes(3).toString("hex");
  }

  //Update
  app.post('/update-rows', (req, res) => {
    readFile(data => {
      // Note: this needs to be more robust for production use. 
      // e.g. use a UUID or some kind of GUID for a unique ID value.
      // add the new user

      editItemIntoArray(data, req.body.uniqueId, req.body)
      writeFile(JSON.stringify(data, null, 2), () => {
        res.status(200).send(true);
      }, rowdataPath);
    }, true, rowdataPath);
  });
  //  //Update
  //  app.post('/update-rows', (req, res) => {
  //     writeFile(JSON.stringify(res, null, 2), () => {
  //       res.status(200).send(true);
  //     }, rowdataPath);
  // });


  function editItemIntoArray(arr, uniqueId, newData) {
    var index = arr.findIndex(x => x.uniqueId == uniqueId);
    if (index != -1) {
      if (Array.isArray(arr[index].subtasks)) {
        newData.subtasks = arr[index].subtasks;
      }
      arr.splice(index, 1, newData)
      return true;
    }
    else {
      arr.forEach(x => {
        if (Array.isArray(x.subtasks)) {
          let val = editItemIntoArray(x.subtasks, uniqueId, newData);
          if (val) {
            return true;
          }
        }
      })
    }
  }

  // delete
  app.post('/delete-rows', (req, res) => {
    readFile(data => {
      // Note: this needs to be more robust for production use. 
      // e.g. use a UUID or some kind of GUID for a unique ID value.
      if (Array.isArray(req.body)) {
        req.body.forEach(uniqueId => {
          removeItemIntoArray(data, uniqueId)
        })
      }
      writeFile(JSON.stringify(data, null, 2), () => {
        res.status(200).send(true);
      }, rowdataPath);
    }, true, rowdataPath);
  });

  function removeItemIntoArray(arr, uniqueId) {
    var index = arr.findIndex(x => x.uniqueId == uniqueId);
    if (index != -1) {
      arr.splice(index, 1)
      return true;
    }
    else {
      arr.forEach(x => {
        if (Array.isArray(x.subtasks)) {
          let val = removeItemIntoArray(x.subtasks, uniqueId);
          if (val) {
            return true;
          }
        }
      })
    }
  }


  // paste
  app.post('/paste-rows', (req, res) => {
    if (Array.isArray(req.body.copyRows)) {
      readFile(data => {
        // Note: this needs to be more robust for production use. 
        // e.g. use a UUID or some kind of GUID for a unique ID value.
        // if(!req.body.isCut){
        copyData(req.body.copyRows)
        // }
        if (req.body.action == "pastestart") {
          data.unshift(...req.body.copyRows);
        }
        if (req.body.action == "pastenext") {
          pasteNextItemIntoArray(data, req.body.uniqueId, req.body.copyRows);
        }
        else if (req.body.action == "pastechild") {
          pasteNextChildItemIntoArray(data, req.body.uniqueId, req.body.copyRows);
        }
        // req.body.copyRows.forEach(row => {
        //   removeItemIntoArray(data, row.uniqueId)
        // })

        writeFile(JSON.stringify(data, null, 2), () => {
          res.status(200).send(true);
        }, rowdataPath);
      }, true, rowdataPath);
    }
  });


  function copyData(arr) {
    arr.forEach(x => {
      x.uniqueId = randomId()
      if (Array.isArray(x.subtasks)) {
        copyData(x.subtasks)
      }
    })
  }
  function pasteNextItemIntoArray(arr, uniqueId, copiedddata) {
    var index = arr.findIndex(x => x.uniqueId == uniqueId);
    if (index != -1) {
      arr.splice(index + 1, 0, ...copiedddata)
    }
    else {
      arr.forEach(x => {
        if (Array.isArray(x.subtasks)) {
          pasteNextItemIntoArray(x.subtasks, uniqueId, copiedddata)
        }
      })
    }

  }
  function pasteNextChildItemIntoArray(arr, uniqueId, copiedddata) {
    var index = arr.findIndex(x => x.uniqueId == uniqueId);
    if (index != -1) {
      if (Array.isArray(arr[index].subtasks)) {
        arr[index].subtasks.push(...copiedddata)
      }
      else {
        arr[index].subtasks = copiedddata;
      }
    }
    else {
      arr.forEach(x => {
        if (Array.isArray(x.subtasks)) {
          pasteNextChildItemIntoArray(x.subtasks, uniqueId, copiedddata)
        }
      })
    }

  }
  //#endregion Rows

  //#region  columns

  // READ
  app.get('/columns', (req, res) => {
    fs.readFile(columndataPath, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      res.send(JSON.parse(data));
    });
  });

  // CREATE
  app.post('/column', (req, res) => {
    readFile(data => {
      // Note: this needs to be more robust for production use. 
      // e.g. use a UUID or some kind of GUID for a unique ID value.
      // add the new column
      data.splice(req.body.index, 0, req.body.column)
      writeFile(JSON.stringify(data, null, 2), () => {
        res.status(200).send(true);
      }, columndataPath);
    }, true, columndataPath);

  });

  // Update
  app.post('/update-column', (req, res) => {
    readFile(data => {
      // Note: this needs to be more robust for production use. 
      // e.g. use a UUID or some kind of GUID for a unique ID value.
      // add the new user
      data[req.body.index] = req.body.column;
      writeFile(JSON.stringify(data, null, 2), () => {
        res.status(200).send(true);
      }, columndataPath);
    }, true, columndataPath);
  });


  // delete
  app.delete('/delete-column/:id', (req, res) => {
    readFile(data => {
      // Note: this needs to be more robust for production use. 
      // e.g. use a UUID or some kind of GUID for a unique ID value.
      const index = req.params['id'];
      data.splice(index, 1);
      writeFile(JSON.stringify(data, null, 2), () => {
        res.status(200).send(true);
      }, columndataPath);
    }, true, columndataPath);
  });

  //#endregion columns
};

module.exports = dataRoutes;
