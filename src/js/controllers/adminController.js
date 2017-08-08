"use strict";

console.log("we in nerds");

d3.select("#submitButton")
  .on("click", clickedButton);

d3.select("#confirmButton")
  .on("click", confirmClicked);

var input = document.getElementById("exampleInputFile").value;
let filename;

// if(input.length != 0){
//       $('#modalAcceptButton').removeClass("disabled");
//     }
//     else{
//       $('#modalAcceptButton').addClass("disabled");
//     }


function clickedButton() {
  d3.event.preventDefault();
  document.getElementById("fileName").innerHTML = document.getElementById("exampleInputFile").value;


  getLogFile()
    .then(function(data) {
      console.log("Log:", data);
    });
}

function confirmClicked() {
  if (typeof window.FileReader !== 'function') {
    alert("The file API isn't supported on this browser yet.");
    return;
  }

  let input = document.getElementById("exampleInputFile");
  let file, fr;

  if (!input) {
    alert("Um, couldn't find the imgfile element.");
  } else if (!input.files) {
    alert("This browser doesn't seem to support the `files` property of file inputs.");
  } else if (!input.files[0]) {
    alert("Please select a file before clicking 'Load'");
  } else {
    file = input.files[0];
    filename = file.name;

    fr = new FileReader();
    fr.onload = sendCSV;
    fr.readAsText(file);
    alert("The file has been updated!");

  }
}

function getLogFile() {
  return new Promise(function(resolve, reject) {
    let xhr = new XMLHttpRequest();

    xhr.onload = function() {
      resolve(this.responseText);
    };
    xhr.onerror = function(e) {
      reject(e);
    };

    xhr.open("GET", "/admin/log");
    xhr.send();
  });
}

function sendCSV(e) {
  let xhr = new XMLHttpRequest();
  xhr.open("PUT", "/admin/csv");
  xhr.setRequestHeader("Content-type", "application/json");

  console.log(e);

  xhr.onload = function() {
    console.log(this.responseText);
  };
  xhr.onerror = function(e) {
    reject(e);
  };

  xhr.send(JSON.stringify({"data": e.target.result, "name": filename}));
}