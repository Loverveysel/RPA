import { personal } from "./personal"
import { education } from "./education"
import { financial } from "./financial"
import { news } from "./news"
import { advertisement } from "./advertisement"
type StatesType = {
    [key: string]: categoryType[]  
}

type categoryType = {
  word: string,
  subcategory: string
}

export const states : StatesType = {
  advertisement,
  personal,
  education,
  financial,
  news
}