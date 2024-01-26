let currentQuestions = null;
let selectedOptions = [];
let totalScore = 0;

// Load the questions and options from a configuration file (config.json)
fetch('config.json')
    .then(response => response.json())
    .then(data => {
        currentQuestions = data;
        initializeQuiz(currentQuestions);
        const nextButton = document.getElementById('next-button');

        if (nextButton) {
            // Pass the currentQuestions to the nextQuestions function
            nextButton.addEventListener('click', function () {
                nextQuestions();
            });
        }
    })
    .catch(error => console.error("Error loading the configuration file:", error));

function initializeQuiz(config) {
    const container = document.getElementById('quiz-container');
    container.innerHTML = ''; // Clear existing questions

    config.forEach(item => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');
        questionDiv.id = `question-${item.id}`;

        const questionNumber = document.createElement('span');
        questionNumber.classList.add('question-number');
        questionNumber.textContent = `Question ${item.id}: `;
        questionDiv.appendChild(questionNumber);

        const questionParagraph = document.createElement('p');
        questionParagraph.textContent = item.question;
        questionDiv.appendChild(questionParagraph);

        item.options.forEach(option => {
            const optionInput = document.createElement('input');
            optionInput.type = item.inputType || 'radio'; // Use radio as default
            optionInput.value = option.id;
            optionInput.name = `question-${item.id}`;

            if (item.inputType === 'checkbox') {
                optionInput.type = 'checkbox';
            }

            const optionLabel = document.createElement('label');
            optionLabel.textContent = option.text;

            questionDiv.appendChild(optionInput);
            questionDiv.appendChild(optionLabel);
            questionDiv.appendChild(document.createElement('br'));
        });

        container.appendChild(questionDiv);

        // Hide conditional questions initially
        if (item.conditional) {
            questionDiv.style.display = 'none';
        }
    });

    // Add event listeners for conditional logic
    config.filter(item => item.conditional).forEach(conditionalItem => {
        document.querySelectorAll(`input[name='question-${conditionalItem.dependsOn.questionId}']`).forEach(input => {
            input.addEventListener('change', function() {
                const selectedOptionId = parseInt(this.value, 10);
                const shouldShow = conditionalItem.dependsOn.optionIds.includes(selectedOptionId);
                document.getElementById(`question-${conditionalItem.id}`).style.display = shouldShow ? 'block' : 'none';
            });
        });
    });
}

const emailDiv = document.getElementById('get-email');
const emailInput = document.getElementById('email-input');
const emailButton = document.getElementById('email-button');

emailDiv.style.display = 'none'; // Hide the email-related div initially

function nextQuestions() {
    if (currentQuestions === null) {
        return;
    }

    const nextButton = document.getElementById('next-button');
    const scoreDisplay = document.getElementById('score-display');

    if (nextButton && scoreDisplay) {
        if (nextButton.textContent.toLowerCase() === 'next') {
            const unansweredQuestions = getUnansweredQuestions(currentQuestions);
            const answeredQuestions = getAnsweredQuestions(currentQuestions);

            if (unansweredQuestions.length > 0) {

                alert('Please answer all questions!');

                // Visual marker for unanswered questions (example: adding a red border)
                unansweredQuestions.forEach(question => {
                    const questionDiv = document.getElementById(`question-${question.id}`);
                    if (questionDiv) {
                        questionDiv.style.border = '2px solid red';
                    }
                });

                answeredQuestions.forEach(question => {
                    const questionDiv = document.getElementById(`question-${question.id}`);
                    if (questionDiv) {
                        questionDiv.style.border = 'none';
                    }
                });
                return;
            }

            const selectedOptions = Array.from(document.querySelectorAll('input[type=radio]:checked, input[type=checkbox]:checked')).map(option => {
                return {
                    name: option.name,
                    value: option.value,
                };
            });

            // Calculate and update the total score using the stored selected options
            totalScore += calculateScore(currentQuestions, selectedOptions);
            console.log(totalScore);

            fetch('context.json')
                .then(response => response.json())
                .then(data => {
                    currentQuestions = data;
                    initializeQuiz(currentQuestions);
                    nextButton.textContent = 'Submit';
                    scoreDisplay.textContent = ''; // Clear previous score

                    // Hide the email-related div when loading new questions
                    emailDiv.style.display = 'block';
                })
                .catch(error => console.error("Error loading the context file:", error));
                
        } else if (nextButton.textContent.toLowerCase() === 'submit') {
            // Check if non-conditional questions are answered before allowing to submit
            const unansweredQuestions = getUnansweredQuestions(currentQuestions);
            const answeredQuestions = getAnsweredQuestions(currentQuestions);

            if (unansweredQuestions.length > 0) {

                alert('Please answer all questions!');

                // Visual marker for unanswered questions (example: adding a red border)
                unansweredQuestions.forEach(question => {
                    const questionDiv = document.getElementById(`question-${question.id}`);
                    if (questionDiv) {
                        questionDiv.style.border = '2px solid red';
                    }
                });

                answeredQuestions.forEach(question => {
                    const questionDiv = document.getElementById(`question-${question.id}`);
                    if (questionDiv) {
                        questionDiv.style.border = 'none';
                    }
                });
                return;
            }

            const container = document.getElementById('quiz-container');
            container.innerHTML = '';
            nextButton.style.display = 'none'; // Hide the button after submitting
            scoreDisplay.textContent = 'Recommended course: ';
            if (totalScore < 85) {
                scoreDisplay.textContent += `Power BI Essentials`;
            } else if (totalScore < 120) {
                scoreDisplay.textContent += `Power BI Report Design`;
            } else if (totalScore < 150) {
                scoreDisplay.textContent += `Power BI Advanced`;
            } else if (totalScore <= 200) {
                scoreDisplay.textContent += `Power BI DAX Essentials`;
            }

            // Show the email-related div when submitting
            emailDiv.style.display = 'none';
        }
    }
}

function getAnsweredQuestions(currentQuestions) {
    return currentQuestions.filter(question => {
        const inputName = `question-${question.id}`;
        const selectedOption = document.querySelector(`input[name='${inputName}']:checked`);

        // Exclude conditional questions from validation check
        if (question.conditional) {
            return false;
        }

        return selectedOption;
    });
}

function getUnansweredQuestions(config) {
    return currentQuestions.filter(question => {
        const inputName = `question-${question.id}`;
        const selectedOption = document.querySelector(`input[name='${inputName}']:checked`);

        // Exclude conditional questions from validation check
        if (question.conditional) {
            return false;
        }

        return !selectedOption;
    });
}

function calculateScore(config, selectedOptions) {
    let localScore = 0;

    if (selectedOptions) {
        selectedOptions.forEach(option => {
            const parentQuestionId = option.name.split('-')[1];
            const displayedQuestion = config.find(q => q.id === parseInt(parentQuestionId));

            if (displayedQuestion) {
                const selectedOption = displayedQuestion.options.find(o => o.id === parseInt(option.value));
                if (selectedOption) {
                    localScore += selectedOption.score;
                } else {
                    console.error(`Error: Selected option not found for question ${parentQuestionId}, option ${option.value}`);
                }
            } else {
                console.error(`Error: Displayed question not found for question ${parentQuestionId}`);
            }
        });
    }

    return localScore;
}