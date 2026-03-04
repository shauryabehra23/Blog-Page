export const BLOG_CATEGORIES = [
  { value: "technology", label: "Technology" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "travel", label: "Travel" },
  { value: "food", label: "Food" },
  { value: "health", label: "Health" },
  { value: "education", label: "Education" },
  { value: "other", label: "Other" },
];

export const ITEMS_PER_PAGE = 10;

export const API_ENDPOINTS = {
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  BLOGS_GET_ALL: "/blogs",
  BLOGS_CREATE: "/blogs",
  USERS_PROFILE: "/users/profile",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
