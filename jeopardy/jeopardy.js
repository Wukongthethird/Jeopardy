"use strict"

const BASE_API_URL = "http://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;
const LOADING_TIME = 5000;
// categories is the main data structure for the app; it should eventually look like this:

//  [

//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: "4", showing: null},
//        {question: "1+1", answer: "2", showing: null}, ... 3 more clues ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null}, ...
//      ],
//    }, ...4 more categories ...
//  ]

let game;
let categories;


/**
 * @param numOfCategories defines columns/titles of the game
 * @param numofCLuesPerCat defines the amount questions/row of the game
 * has a property for IDs and Categories storing the game data itself
 */

class Jeopardy {


  constructor(numOfCategories, numOfCluesPerCat) {
    this.numOfCategories = numOfCategories;
    this.numOfCluesPerCat = numOfCluesPerCat;
    this.randomIDArray = [];
    this.categories = [];
  }

  /** Get NUM_CATEGORIES random categories from API.
   * 
   * Returns array of category ids, e.g. [4, 12, 5, 9, 20, 1]
   */
  async getCategoryIds() {
    let randomOffset = _.random(0, 150);

    let responseOfCategories = await axios({
      url: `${BASE_API_URL}categories`,
      method: "GET",
      params: {
        count: 100,
        offset: randomOffset
      }
    });

    let responseIDArray =
      responseOfCategories.data.map((val) => val.id);
    let randomCatIDArray = _.sampleSize(responseIDArray, this.numOfCategories);

    this.randomIDArray = randomCatIDArray;
  }


  /** Return object with data about a category:
   *
   *  Returns { title: "Math", clues: clue-array }
   *
   * Where clue-array is:
   *   [
   *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
   *      {question: "Bell Jar Author", answer: "Plath", showing: null},
   *      ... 3 more ...
   *   ]
   */

  async getCategory(catId) {

    let response = await axios({
      url: `${BASE_API_URL}category`,
      method: "GET",
      params: {
        id: catId
      }
    });

    let clueArray = response.data.clues.slice(0, this.numOfCluesPerCat);
    clueArray.forEach((clue) =>
      clue.show = null
    );

    let category = {
      title: response.data.title,
      clues: {
        clue: clueArray,
      }
    };
    return category;
  }

  /** calls getCategoryIds and getCategory
   * to create the randomIDArray and categories list
   */
  async categoriesGen() {
    let categoriesList = [];
    await this.getCategoryIds();
    for (let categoryId of this.randomIDArray) {
      const category = await this.getCategory(categoryId)
      categoriesList.push(category)
    };
    this.categories = categoriesList;
  }
}


/** Fill an HTML table with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM-QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initially, just show a "?" where the question/answer would go.)
 */
function fillTable() {

  //creating table template
  let $table = $(`<table class="table table-bordered"></table>`);
  let tableStarter = (`<thead id = "table-head"> <tr  id = "table-head-row"> </tr></thead>`
    + `<tbody id = "table-body"></tbody>`);
  $table.append(tableStarter);
  $("body").append($table);
  let $tableHead = $('#table-head-row');
  let $tableBody = $("#table-body");

  // titles headers
  for (let titles = 0; titles < categories.length; titles++) {
    let $title = $(`<td >${categories[titles].title}</td>`);
    $tableHead.append($title);
  }

  // question
  for (let titles = 0; titles < NUM_CLUES_PER_CAT; titles++) {
    let $row = $(`<tr id = ${titles}></tr>"`);

    for (let clue = 0; clue < NUM_CATEGORIES; clue++) {
      let $rowTd = (`<td class = "clues" id = "${titles}-${clue}" >
                <i class="far fa-question-circle"></span></td>`);
      $row.append($rowTd);
    }
    $tableBody.append($row);
  }
}


/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */


function handleClick(evt) {
  evt.preventDefault();
  $event = $(evt.target);
  let clueId;

  // grabs the id regardless of where in the square was clicked
  if (
    $event.prop("tagName") === "I" ||
    $event.prop("tagName") === "P"
  ) {
    clueId = ($event.parent().attr("id"));
  } else if (
    $event.prop("tagName") === "TD") {
    clueId = $event.attr("id");
  }

  let $clueElement = $(`#${clueId}`);
  let clueInfo = categories[clueId[2]].clues.clue[clueId[0]];
  let clueShow = clueInfo.show;

  if (clueShow === null) {
    $clueElement.empty();
    $clueElement.html(`<p>${clueInfo.question}</p>`);
    $clueElement.css('background-color', 'green');
    clueInfo.show = "question";
  } else if (clueShow === "question") {
    $clueElement.empty();
    $clueElement.html(`<p>${clueInfo.answer}</p>`);
  }
}



/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  
  let $table = $(".table");
  $table.remove();
  $(".fa-3x").empty();
  let spinner = '<i class="fas fa-spinner fa-spin">'
  $(".fa-3x").append(spinner);
  $("#btn").text("Loading .... Give it a bit");
}

/** Remove the loading spinner and update the button used to fetch data. */
function hideLoadingView() {
  $("#btn").text("Restart");
  $("body .fa-3x").empty();
}

/** Setup game data and board:
 * - get random category Ids
 * - get data for each category
 * - call fillTable to create HTML table
 */

async function setupGameBoard() {
  game = new Jeopardy(NUM_CATEGORIES, NUM_CLUES_PER_CAT);
  await game.categoriesGen();
  categories = game.categories;
  fillTable();
}


/** Start game: show loading state, setup game board, stop loading state */

async function setupAndStart() {
  showLoadingView();
  await setupGameBoard();
  hideLoadingView();
}

/** At start:
 *
 * - Add a click handler to your start button that will run setupAndStart
 * - Add a click handler to your board that will run handleClick
 *   when you click on a clue
 */

// ADD THOSE THINGS HERE
$("body").on("click", ".btn", setupAndStart);
$("body").on("click", ".clues", handleClick);