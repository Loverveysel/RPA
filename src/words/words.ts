import { buiseness } from "./buiseness"
import { personal } from "./personal"
import { education } from "./education"
import { advertisement } from "./advertisement"

type wordType = {
    [key: string]: string[]
}

export const states : wordType = {
  buiseness,
  personal,
  education,
  advertisement
}