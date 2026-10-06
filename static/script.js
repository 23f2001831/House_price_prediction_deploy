
// =========================================================
// HOUSE PRICE PREDICTOR
// Frontend prediction logic
// =========================================================


// ---------------------------------------------------------
// Get HTML elements
// ---------------------------------------------------------

const predictionForm = document.getElementById("predictionForm");

const predictButton = document.getElementById("predictButton");

const buttonText = document.getElementById("buttonText");

const loadingSpinner = document.getElementById("loadingSpinner");

const resetButton = document.getElementById("resetButton");

const resultCard = document.getElementById("resultCard");

const predictionValue = document.getElementById("predictionValue");

const newPredictionButton =
    document.getElementById("newPredictionButton");

const errorMessage =
    document.getElementById("errorMessage");

const errorText =
    document.getElementById("errorText");


// ---------------------------------------------------------
// Feature names
// ---------------------------------------------------------

const featureNames = [
    "IncomeLevel",
    "PropertyAge",
    "TotalRooms",
    "TotalBedrooms",
    "NeighborhoodPop",
    "AvgOccupancy",
    "Latitude",
    "Longitude",
    "RoomsPerHousehold",
    "BedroomsRatio"
];


// ---------------------------------------------------------
// Form submission
// ---------------------------------------------------------

predictionForm.addEventListener("submit", async function (event) {

    // Prevent normal HTML form submission
    event.preventDefault();

    // Hide old result/error
    hideResult();
    hideError();

    // Collect input values
    const formData = new FormData(predictionForm);

    const data = {};

    for (const feature of featureNames) {

        const value = formData.get(feature);

        if (value === null || value === "") {

            showError(
                `Please enter a value for ${feature}.`
            );

            return;
        }

        const numberValue = Number(value);

        if (!Number.isFinite(numberValue)) {

            showError(
                `Please enter a valid number for ${feature}.`
            );

            return;
        }

        data[feature] = numberValue;
    }


    // -----------------------------------------------------
    // Basic validation
    // -----------------------------------------------------

    if (data.TotalBedrooms > data.TotalRooms) {

        showError(
            "Total bedrooms cannot be greater than total rooms."
        );

        return;
    }


    if (data.PropertyAge < 0) {

        showError(
            "Property age cannot be negative."
        );

        return;
    }


    if (data.AvgOccupancy < 0) {

        showError(
            "Average occupancy cannot be negative."
        );

        return;
    }


    // -----------------------------------------------------
    // Calculate derived features if needed
    // -----------------------------------------------------

    /*
       If the user enters TotalRooms and TotalBedrooms,
       these two features can be calculated automatically.

       We still keep the fields in the UI because they are
       part of the model input.
    */

    if (
        data.TotalRooms > 0 &&
        data.TotalBedrooms >= 0
    ) {

        data.BedroomsRatio =
            data.TotalBedrooms / data.TotalRooms;
    }


    // -----------------------------------------------------
    // Start loading state
    // -----------------------------------------------------

    setLoading(true);


    try {

        // -------------------------------------------------
        // Send request to FastAPI
        // -------------------------------------------------

        const response = await fetch("/predict", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });


        // -------------------------------------------------
        // Read response
        // -------------------------------------------------

        const result = await response.json();


        // -------------------------------------------------
        // Handle API error
        // -------------------------------------------------

        if (!response.ok) {

            let message =
                "Prediction failed. Please try again.";

            if (result.detail) {
                message = result.detail;
            }

            throw new Error(message);
        }


        // -------------------------------------------------
        // Get prediction
        // -------------------------------------------------

        const prediction = Number(
            result.prediction
        );


        if (!Number.isFinite(prediction)) {

            throw new Error(
                "The server returned an invalid prediction."
            );
        }


        // -------------------------------------------------
        // Display prediction
        // -------------------------------------------------

        displayPrediction(prediction);


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        showError(
            error.message ||
            "Unable to connect to the prediction server."
        );

    } finally {

        // Always stop loading
        setLoading(false);

    }

});


// ---------------------------------------------------------
// Display prediction
// ---------------------------------------------------------

function displayPrediction(prediction) {

    /*
       The model's price scale depends on your training data.

       We display the value with commas and two decimal places.
    */

    const formattedPrice =
        prediction.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );


    predictionValue.textContent =
        `$${formattedPrice}`;


    resultCard.classList.remove("hidden");


    // Scroll smoothly to result
    setTimeout(() => {

        resultCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }, 100);

}


// ---------------------------------------------------------
// Loading state
// ---------------------------------------------------------

function setLoading(isLoading) {

    predictButton.disabled = isLoading;

    if (isLoading) {

        buttonText.textContent =
            "Estimating...";

        loadingSpinner.classList.remove(
            "hidden"
        );

    } else {

        buttonText.textContent =
            "Estimate House Price";

        loadingSpinner.classList.add(
            "hidden"
        );

    }

}


// ---------------------------------------------------------
// Reset form
// ---------------------------------------------------------

resetButton.addEventListener(
    "click",
    function () {

        predictionForm.reset();

        hideResult();

        hideError();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// ---------------------------------------------------------
// New prediction button
// ---------------------------------------------------------

newPredictionButton.addEventListener(
    "click",
    function () {

        predictionForm.reset();

        hideResult();

        hideError();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// ---------------------------------------------------------
// Hide result
// ---------------------------------------------------------

function hideResult() {

    resultCard.classList.add(
        "hidden"
    );

}


// ---------------------------------------------------------
// Show error
// ---------------------------------------------------------

function showError(message) {

    errorText.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        errorMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }, 100);

}


// ---------------------------------------------------------
// Hide error
// ---------------------------------------------------------

function hideError() {

    errorMessage.classList.add(
        "hidden"
    );

}
