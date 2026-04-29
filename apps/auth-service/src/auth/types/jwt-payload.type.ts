// This type describes the data we put inside the JWT.
// Keep this small because JWTs are sent with every authenticated request.
export type JwtPayload = {
  // sub is the standard JWT field for the subject/user ID.
  sub: string;
  // Email is useful for debugging and simple identity display.
  email: string;
};
