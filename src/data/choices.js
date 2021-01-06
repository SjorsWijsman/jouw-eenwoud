export const choices = [
  {
    title: "Mollen in Eenwoud",
    description: "Er zijn mollen in de grond gevonden die de bomen storen. \nOm de mollen weg te halen, kost dat wel wat geld en tijd. Laat je ze weghalen of laat je ze zitten?",
    choices: {
      "Weghalen": {
        effect: [["munten", -50]],
        resultText: "De mollen zijn vrijwillig verhuist naar een boerderij waar ze oud en gelukkig zullen worden.",
      },
      "Laten Zitten": {
        effect: [["bomen", -3]],
        resultText: "Je hebt ervoor gekozen om de mollen hun gang te laten gaan. Als dank hebben ze 3 van je bomen ge/mol/d.",
      },
    }
  }
]
