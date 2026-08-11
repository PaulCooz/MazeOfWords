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
    ["Level"]: {
        ["ru"]: "Уровень",
        ["en"]: "Level",
    },
    ["ru"]: { ["ru"]: "Русский", ["en"]: "Русский" },
    ["en"]: { ["ru"]: "English", ["en"]: "English" },
}