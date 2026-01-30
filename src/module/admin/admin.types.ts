import  z from "zod";

export interface updateUserType {
    name:string,
    email:string,
    image?:string | null,

}

export interface updatedCategoryType{
    name:string
}







// model User {
//   id        String   @id @default(cuid())
//   name      String
//   email     String   @unique
//   image     String?
//   // password  String 
//   role      Role     @default(CUSTOMER)
//   isBanned  Boolean  @default(false)
//   createdAt DateTime @default(now())

//   medicines     Medicine[]
//   orders        Order[]
//   reviews       Review[]
//   emailVerified Boolean    @default(false)
//   updatedAt     DateTime   @updatedAt
//   sessions      Session[]
//   accounts      Account[]
//   @@map("user")
//   // @@map("user")
// }
