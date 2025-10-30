import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./config";

// login
export const login = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// logout
export const logout = async () => {
  return signOut(auth);
};
