import i18n from '../i18n';
import { CAMPUSES, CATEGORIES, type CampusId, type PlaceCategory } from '../data/campus';

// The words for campuses and kinds of place, in the student's language. Building names stay as the
// university writes them, because that is what is printed on the signs.
export const campusName = (id: CampusId) => i18n.t(`map.campus.${id}`, { defaultValue: CAMPUSES[id].name });
export const campusIntro = (id: CampusId) => i18n.t(`map.intro.${id}`, { defaultValue: CAMPUSES[id].intro });
export const campusNumbering = (id: CampusId) => i18n.t(`map.numbering.${id}`, { defaultValue: CAMPUSES[id].numbering });
export const categoryLabel = (category: PlaceCategory) => i18n.t(`map.category.${category}`, { defaultValue: CATEGORIES[category].label });
