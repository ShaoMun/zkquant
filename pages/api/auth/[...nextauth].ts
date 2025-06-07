import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

console.log('DEBUG: Loading NextAuth config');
console.log('DEBUG: GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID);
console.log('DEBUG: GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET);
console.log('DEBUG: NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('DEBUG: signIn callback', { user, account, profile, email, credentials });
      return true;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      console.log('DEBUG: jwt callback', { token, user, account, profile, isNewUser });
      return token;
    },
    async session({ session, token, user }) {
      console.log('DEBUG: session callback', { session, token, user });
      return session;
    },
  },
}); 