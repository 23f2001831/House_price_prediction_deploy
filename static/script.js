const predictionForm =
    document.getElementById("predictionForm");

const predictButton =
    document.getElementById("predictButton");

const buttonText =
    document.getElementById("buttonText");

const loadingSpinner =
    document.getElementById("loadingSpinner");

const resetButton =
    document.getElementById("resetButton");

const resultCard =
    document.getElementById("resultCard");

const predictionValue =
    document.getElementById("predictionValue");

const newPredictionButton =
    document.getElementById("newPredictionButton");

const errorMessage =
    document.getElementById("errorMessage");

const errorText =
    document.getElementById("errorText");


// ---------------------------------------------------------
// Elements
// ---------------------------------------------------------

const incomeInput =
    document.getElementById("IncomeLevel");

const roomsInput =
    document.getElementById("TotalRooms");

const bedroomsInput =
    document.getElementById("TotalBedrooms");

const occupancyInput =
    document.getElementById("AvgOccupancy");

const locationSelect =
    document.getElementById("location");

const latitudeInput =
    document.getElementById("Latitude");

const longitudeInput =
    document.getElementById("Longitude");

const roomsPerHouseholdInput =
    document.getElementById("RoomsPerHousehold");

const bedroomsRatioInput =
    document.getElementById("BedroomsRatio");

const roomsDisplay =
    document.getElementById("roomsPerHouseholdDisplay");

const bedroomsRatioDisplay =
    document.getElementById("bedroomsRatioDisplay");

const coordinateText =
    document.getElementById("coordinateText");


// ---------------------------------------------------------
// Update location
// ---------------------------------------------------------

function updateLocation() {

    const selected =
        locationSelect.options[
            locationSelect.selectedIndex
        ];

    const latitude =
        Number(selected.dataset.lat);

    const longitude =
        Number(selected.dataset.lon);


    latitudeInput.value = latitude;
    longitudeInput.value = longitude;


    coordinateText.textContent =
        `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}


// ---------------------------------------------------------
// Calculate derived features
// ---------------------------------------------------------

function updateCalculatedFeatures() {

    const rooms =
        Number(roomsInput.value);

    const bedrooms =
        Number(bedroomsInput.value);

    const occupancy =
        Number(occupancyInput.value);


    // RoomsPerHousehold
    //
    // Based on the feature relationship used
    // in the original training data.

    if (
        Number.isFinite(rooms) &&
        Number.isFinite(occupancy) &&
        occupancy > 0
    ) {

        const roomsPerHousehold =
            rooms / occupancy;

        roomsPerHouseholdInput.value =
            roomsPerHousehold;

        roomsDisplay.textContent =
            roomsPerHousehold.toFixed(2);

    }


    // BedroomsRatio

    if (
        Number.isFinite(rooms) &&
        Number.isFinite(bedrooms) &&
        rooms > 0
    ) {

        const ratio =
            bedrooms / rooms;

        bedroomsRatioInput.value =
            ratio;

        bedroomsRatioDisplay.textContent =
            ratio.toFixed(2);

    }
}


// ---------------------------------------------------------
// Listen for changes
// ---------------------------------------------------------

locationSelect.addEventListener(
    "change",
    updateLocation
);

roomsInput.addEventListener(
    "input",
    updateCalculatedFeatures
);

bedroomsInput.addEventListener(
    "input",
    updateCalculatedFeatures
);

occupancyInput.addEventListener(
    "input",
    updateCalculatedFeatures
);


// ---------------------------------------------------------
// Initial values
// ---------------------------------------------------------

updateLocation();
updateCalculatedFeatures();


// ---------------------------------------------------------
// Submit prediction
// ---------------------------------------------------------

predictionForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        hideError();
        hideResult();

        updateCalculatedFeatures();


        // ---------------------------------------------
        // Friendly UI values
        // ---------------------------------------------

        const incomeDollars =
            Number(incomeInput.value);


        // The trained model expects IncomeLevel
        // in units of $10,000.

        const incomeModelValue =
            incomeDollars / 10000;


        const data = {

            IncomeLevel:
                incomeModelValue,

            PropertyAge:
                Number(
                    document.getElementById(
                        "PropertyAge"
                    ).value
                ),

            TotalRooms:
                Number(
                    roomsInput.value
                ),

            TotalBedrooms:
                Number(
                    bedroomsInput.value
                ),

            NeighborhoodPop:
                Number(
                    document.getElementById(
                        "NeighborhoodPop"
                    ).value
                ),

            AvgOccupancy:
                Number(
                    occupancyInput.value
                ),

            Latitude:
                Number(
                    latitudeInput.value
                ),

            Longitude:
                Number(
                    longitudeInput.value
                ),

            RoomsPerHousehold:
                Number(
                    roomsPerHouseholdInput.value
                ),

            BedroomsRatio:
                Number(
                    bedroomsRatioInput.value
                )

        };


        // ---------------------------------------------
        // Validation
        // ---------------------------------------------

        if (
            data.TotalBedrooms >
            data.TotalRooms
        ) {

            showError(
                "Average bedrooms cannot be greater than average rooms."
            );

            return;
        }


        if (
            data.IncomeLevel < 1 ||
            data.IncomeLevel > 15
        ) {

            showError(
                "Household income must be between $10,000 and $150,000."
            );

            return;
        }


        if (
            data.TotalRooms <= 0 ||
            data.TotalBedrooms <= 0
        ) {

            showError(
                "Rooms and bedrooms must be greater than zero."
            );

            return;
        }


        // ---------------------------------------------
        // Loading
        // ---------------------------------------------

        setLoading(true);


        try {

            const response =
                await fetch(
                    "/predict",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data)
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.detail ||
                    "Prediction failed."
                );

            }


            const modelPrediction =
                Number(result.prediction);


            if (
                !Number.isFinite(
                    modelPrediction
                )
            ) {

                throw new Error(
                    "The model returned an invalid prediction."
                );

            }


            // -----------------------------------------
            // IMPORTANT:
            //
            // Your model predicts the target in
            // units of $100,000.
            //
            // Example:
            // 2.85 -> $285,000
            // -----------------------------------------

            const housePrice =
                modelPrediction * 100000;


            displayPrediction(
                housePrice
            );


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

            setLoading(false);

        }

    }
);


// ---------------------------------------------------------
// Display prediction
// ---------------------------------------------------------

function displayPrediction(price) {

    predictionValue.textContent =
        price.toLocaleString(
            "en-US",
            {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0
            }
        );


    resultCard.classList.remove(
        "hidden"
    );


    setTimeout(
        function () {

            resultCard.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        },
        100
    );

}


// ---------------------------------------------------------
// Loading state
// ---------------------------------------------------------

function setLoading(isLoading) {

    predictButton.disabled =
        isLoading;


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
// Reset
// ---------------------------------------------------------

resetButton.addEventListener(
    "click",
    function () {

        predictionForm.reset();

        hideResult();
        hideError();

        updateLocation();
        updateCalculatedFeatures();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// ---------------------------------------------------------
// New prediction
// ---------------------------------------------------------

newPredictionButton.addEventListener(
    "click",
    function () {

        predictionForm.reset();

        hideResult();
        hideError();

        updateLocation();
        updateCalculatedFeatures();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

function hideResult() {

    resultCard.classList.add(
        "hidden"
    );

}


function showError(message) {

    errorText.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );

}


function hideError() {

    errorMessage.classList.add(
        "hidden"
    );

}
