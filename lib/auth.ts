// Simplified auth configuration for messaging system
export const authOptions = {
  providers: [],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    }
  }
};