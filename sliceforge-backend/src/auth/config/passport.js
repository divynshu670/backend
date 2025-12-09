import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../../db/prisma.js";

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL;

if (clientID && clientSecret && callbackURL) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false, { message: "No email from Google" });

          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                name: profile.displayName || "Google User",
                email,
                googleId: profile.id
              }
            });
          } else if (!user.googleId) {
            await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.id } });
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
} else {
  console.warn("Google OAuth not configured (missing env vars)");
}

export default passport;
