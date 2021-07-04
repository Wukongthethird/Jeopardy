const BASE_API_URL = "http://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;
const LOADING_TIME = 10000;
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

let categories = [];

/** Get NUM_CATEGORIES random categories from API.
 *
 * Returns array of category ids, e.g. [4, 12, 5, 9, 20, 1]
 */


async function getCategoryIds() {
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

    let randomCatIDArray = _.sampleSize(responseIDArray, NUM_CATEGORIES);

    return randomCatIDArray;
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

async function getCategory(catId) {
    let response = await axios({
        url: `${BASE_API_URL}category`,
        method: "GET",
        params: {
            id: catId
        }
    });
    console.log()

    let clueArray = response.data.clues.slice(0, 5);
    clueArray.forEach((clue) =>
        clue.show = null
    )
    let category = {

        title: response.data.title,
        clues: {
            clue: clueArray,
        }
    };

    return category;
}

/** Fill an HTML table with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM-QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initially, just show a "?" where the question/answer would go.)
 */


/**todo might need to remove this function, currently using it to generqate categories */
/** add eventlistener on start button */
async function categoriesGen() {
    let categoriesId = await getCategoryIds();
    for (let categoryId of categoriesId) {
        const category = await getCategory(categoryId);
        categories.push(category)
    }
}



function fillTable() {

    let $table = $( '<table id="question-table"></table>')
    let tableStarter = ('<thead id = "table-head"> <tr id = "table-head-row"> </tr></thead>' 
        + '<tbody id = "table-body"></tbody>')
    $table.append(tableStarter)
    $("body").append($table)

    let $tableHead= $('#table-head-row')
    let $tableBody = $("#table-body")

    for (let titles = 0; titles < categories.length; titles++) {
        let $title = $(`<td>${categories[titles].title}</td>`)
        $tableHead.append($title)
    }

    for (let titles = 0; titles < NUM_CLUES_PER_CAT; titles++) {
        let $row = $(`<tr id = ${titles}></tr>"`)

        for (let clue = 0; clue < NUM_CATEGORIES; clue++) {
            //maybe add the id/question/answer
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
    $event = $(evt.target)
    let clueId;

    if (
        $event.prop("tagName") === "I" ||
        $event.prop("tagName") === "P"
    ) {
        clueId = ($event.parent().attr("id"))
        // clueId = $event.attr("id");
    } else if ($event.prop("tagName") === "TD") {
        clueId = $event.attr("id");
    }

    let $clueElement = $(`#${clueId}`)
    let clueInfo = categories[ clueId[2] ].clues.clue[ clueId[0] ]
    let clueQuestion = clueInfo.question
    let clueAnswer = clueInfo.answer
    let clueShow =  clueInfo.show

    if(clueShow === null){
        $clueElement.empty()
        $clueElement.html( `<p>${clueQuestion}</p>`)
        clueInfo.show = "question"

    } else if(clueShow === "question"){
        $clueElement.empty()
        $clueElement.html( `<p>${clueAnswer}</p>`)
        clueInfo.show = "question"
    } 
}



/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $table = $("#question-table")
    $table.empty()
    $(".fa-3x").empty()
    let spinner = '<i class="fas fa-spinner fa-spin">'
    $(".fa-3x").append(spinner)
    $("#start-button").text("Loading .... Give it a bit")

}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $("#start-button").text("Restart")
    $("body .fa-3x").empty()
}

/** Setup game data and board:
 * - get random category Ids
 * - get data for each category
 * - call fillTable to create HTML table
 */

async function setupGameBoard() {

    let categoriesId = await getCategoryIds();
    for (let categoryId of categoriesId) {
        const category = await getCategory(categoryId);
        categories.push(category)
    }
    fillTable()
}

/** Start game: show loading state, setup game board, stop loading state */

async function setupAndStart() {
    categories = [];
    showLoadingView(); 
    setTimeout(await setupGameBoard(),LOADING_TIME)
    hideLoadingView();   
}

/** At start:
 *
 * - Add a click handler to your start button that will run setupAndStart
 * - Add a click handler to your board that will run handleClick
 *   when you click on a clue
 */

// ADD THOSE THINGS HERE

$( document ).ready(
    $("#start-button").on("click", setupAndStart),
    $(".clues").on("click",  handleClick)
)

$("#start-button").on("click", setupAndStart),
$(".clues").on("click",  handleClick)

