"use server"

import { auth } from "@/firebase/server";
import { signupSchema } from "@/validation/signupSchema"

export const signupUser = async (data: {
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
}) => {
  const validateData = signupSchema.safeParse(data);

  if(!validateData.success){
    return{
      error: true,
      message: validateData.error.issues[0]?.message ?? "Error in validation signup data",
    }
  }

  try{
    await auth.createUser({
      displayName: data.fullName,
      email: data.email,
      password: data.password
    })
    return {
      error: false,
      message: "User created successfully"
    }
  } catch(e){
    return {
      error: true,
      message: "Could not signup user"
    }
  }

}