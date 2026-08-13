import { Locale } from "./Common"
import { PlayerStorage } from "./PlayerStorage"

export function localize(key: string) {
    return Translations[key][PlayerStorage.lang.value]
}

const Translations: { [key in string]: { [key in Locale]: string } } = {
    ["Settings"]: {
        ["ru"]: "Настройки",
        ["en"]: "Settings",
    },
    ["Sound"]: {
        ["ru"]: "Звук",
        ["en"]: "Sound",
    },
    ["Music"]: {
        ["ru"]: "Музыка",
        ["en"]: "Music",
    },
    ["Language"]: {
        ["ru"]: "Язык",
        ["en"]: "Language",
    },
    ["Next_Level"]: {
        ["ru"]: "Далее",
        ["en"]: "Next Level",
    },
    ["Definition"]: {
        ["ru"]: "Определение",
        ["en"]: "Definition",
    },
    ["LVL"]: {
        ["ru"]: "уровень",
        ["en"]: "level",
    },
    ["Loading"]: {
        ["ru"]: "Загрузка...",
        ["en"]: "Loading...",
    },
    ["NoCoinsForHint"]: {
        ["ru"]: "Нет монет. Вы можете получить их за рекламу",
        ["en"]: "No coins. You can get them for advertising",
    },
    ["TutorTrace"]: {
        ["ru"]: "Проведите по буквам, чтобы выделить слово",
        ["en"]: "Swipe the letters to enter the word",
    },
    ["ForAdv"]: {
        ["ru"]: "за рекл",
        ["en"]: "for adv",
    },
    ["Hint"]: {
        ["ru"]: "+буква",
        ["en"]: "+letter",
    },
    ["ru"]: { ["ru"]: "Русский", ["en"]: "Русский" },
    ["en"]: { ["ru"]: "English", ["en"]: "English" },
}