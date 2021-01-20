export const choices = [
  {
    type: "Quiz-vraag",
    description: "Bossen worden wel eens de groene longen van onze aarde genoemd. Waarom is dat?",
    choices: {
      "Omdat ze overdag koolstofdioxide (CO2) opslaan en zuurstof afgeven": {
        effect: [["bomen", 1]],
        resultText: "Dit was het goede antwoord!",
      },
      "Omdat ze 's nachts koolstofdioxide (CO2) opslaan en zuurstof afgeven": {
        effect: [["zaden", 0]],
        resultText: "Dat was helaas niet het goede antwoord. Het antwoord was:",
      },
      "Omdat ze op satellietbeelden de vorm van longen hebben": {
        effect: [["zaden", 0]],
        resultText: "Dat was helaas niet het goede antwoord. Het antwoord was:",
      },
      "Omdat bossen zwaveldioxide filteren": {
        effect: [["zaden", 0]],
        resultText: "Dat was helaas niet het goede antwoord. Het antwoord was:",
      },
    }
  },
]
