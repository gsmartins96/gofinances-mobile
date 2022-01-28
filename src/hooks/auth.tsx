import React, { 
  createContext, 
  ReactNode, 
  useContext, 
  useState,
  useEffect
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication'

const { CLIENT_ID } = process.env;
const { REDIRECT_URI } = process.env;

interface AuthProviderProps{
  children: ReactNode;
}

interface User {
  id: string;
  name: string;
  email: string;
  photo?: string
}

interface AuthContextData{
  user: User;
  signInWithGoogle(): Promise<void>;
  signInWithApple(): Promise<void>;
  signOut(): Promise<void>;
  userStorageLoading: boolean;
}

interface AuthorizationResponse{
  params: {
    access_token: string;
  };
  type: string;
}

const AuthContext = createContext({} as AuthContextData);

function AuthProvider({ children }: AuthProviderProps){
  const [user, setUser] = useState<User>({} as User);
  const [userStorageLoading, setUserStorageLoading] = useState(true);
  const userStorageKey = '@gofinances:user'

  useEffect(() => {
    async function loadUserStorageData(){
      const userStorage = await AsyncStorage.getItem(userStorageKey)

      if(userStorage){
        const userLogged = JSON.parse(userStorage) as User;

        setUser(userLogged);
      }
      setUserStorageLoading(false)
    }

    loadUserStorageData();
  }, [])

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signInWithApple, signOut, userStorageLoading }}>
      { children }
    </AuthContext.Provider>
  )

  async function signInWithGoogle(){
    try {
      const RESPONSE_TYPE = 'token';
      const SCOPE = encodeURI('profile email');
      
      const googleUrl = "https://accounts.google.com/o/oauth2/v2/auth"
      const authUrl = `${googleUrl}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;
      const { params, type } = await AuthSession.startAsync({ authUrl }) as AuthorizationResponse;   

      if(type === 'success'){
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?auth=json&access_token=${params.access_token}`);
        const userInfo = await response.json();
        
        const userData = {
          id: userInfo.id,
          name: userInfo.given_name,
          email: userInfo.email,
          photo: userInfo.picture,
        }

        setUser(userData)

        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userData));
      }
    } catch(error) {
      throw new Error(error as string);
    }
  }

  async function signInWithApple(){
    try {
      const userInfo = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ]
      });

      if(userInfo){
        const userLogged = {
          id: String(userInfo.user),
          email: userInfo.email!,
          name: userInfo.fullName!.givenName!,
          photo: `https://ui-avatars.com/api/?name=${userInfo.fullName?.givenName}&length=1`,
        }

        setUser(userLogged)
        await AsyncStorage.setItem(userStorageKey, JSON.stringify(userLogged));
      }

    } catch (error) {
      throw new Error(error as string)
    }
  }

  async function signOut(){
    setUser({} as User);
    await AsyncStorage.removeItem(userStorageKey)
  }
}

function useAuth(){
  const context = useContext(AuthContext);

  return context;
}

export { AuthProvider, useAuth }

