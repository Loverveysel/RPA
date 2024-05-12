import GoogleProvider from "next-auth/providers/google"

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    jwt: true,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      authorization:{params: {scope: 'openid https://www.googleapis.com/auth/gmail.readonly'}},
    }),
  ],
  callbacks: {
    async signIn({ user, account, target }) {
      if (account.provider === "google") {
        return user
      }
    },
    async session({ session, token, user }) {
        session.token = token
        return session
      },
      async jwt({ token, user, account, profile, isNewUser }) {
        if (user) {
          token.id = user.id
        }
        if (account) {
          token.accessToken = account.access_token
        }
        return token
      },
  },
}

export function auth(  // <-- use this function to access the jwt from React components
...args
) {
    return getServerSession(...args, authOptions)
}

export default authOptions