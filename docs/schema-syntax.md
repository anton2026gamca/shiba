
```ts
// Shared scalar aliases
type ID = string;            // uuid
type URL = string;           // https://...
type Email = string;         // user@example.com
type ISODate = string;       // YYYY-MM-DD
type ISODateTime = string;   // 2025-01-01T12:34:56Z

// Enums
type TransactionFunction = 'ADD' | 'SUBTRACT';
type SignedBy = 'Thomas' | 'Kai Ling' | 'Tongyu';
type PlaytestStatus = 'Assigned' | 'Completed';
type YSWSSubmissionStatus = 'Pending' | 'Submitted' | 'Submitted-Needs-Update';

// Users
interface User {
  id: ID;
  email: Email;
  slackId?: string | null;
  githubUsername?: string | null;

  firstName: string;
  lastName: string;

  streetAddress1?: string | null;   // "street address"
  streetAddress2?: string | null;   // "street address #2"
  city?: string | null;
  zipcode?: string | null;
  country?: string | null;

  howHeard?: string | null;         // "how did you hear about this?"
  doingWell?: string | null;        // "what are we doing well?"
  improve?: string | null;          // "how can we improve?"

  birthday?: ISODate | null;

  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
}

// Games
interface Game {
  id: ID;
  playableUrl: URL;                 // e.g., shiba.hackclub.com/play/{id}
  githubUrl?: URL | null;
  createdBy: ID;                    // FK -> User.id
  name: string;
  description?: string | null;
  thumbnailUrl?: URL | null;        // R2 image URL
  hackatimeProjects?: string[];     // array of strings
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
}

// Transactions
interface Transaction {
  id: ID;
  fn: TransactionFunction;          // ADD | SUBTRACT
  coins: ID[];                      // list of Coin IDs
  userImpacted: ID;                 // FK -> User.id
  shopItemPurchased?: ID | null;    // FK -> Shop.id (optional)
  createdAt?: ISODateTime;
}

// Coins
interface Coin {
  id: ID;
  belongsTo: ID;                    // FK -> Transaction.id
  signedBy: SignedBy;               // 'Thomas' | 'Kai Ling' | 'Tongyu'
  forShip?: ID | null;              // FK -> Ship.id
  createdAt?: ISODateTime;
}

// Posts
interface Post {
  id: ID;
  content: string;
  attachments?: URL[];              // file/image URLs
  userId: ID;                       // FK -> User.id
  gameId?: ID | null;               // FK -> Game.id
  createdAt: ISODateTime;
}

// Releases
interface Release {
  id: ID;
  fileUploadUrl: URL;               // R2 link
  gameId: ID;                       // FK -> Game.id
  releaseNotes?: string | null;
  hoursLoggedInRelease?: number | null;
  createdAt?: ISODateTime;
}

// OTP
interface OTP {
  id: ID;
  email: Email;
  otpCode: string;
  used: boolean;
  createdAt: ISODateTime;
}

// Orders
interface Order {
  id: ID;
  itemId: ID;                       // FK -> Shop.id
  userId: ID;                       // FK -> User.id
  createdAt?: ISODateTime;
}

// Shop items
interface Shop {
  id: ID;
  item: string;                     // name/title
  cost: number;                     // numeric currency amount
  stockAvailable: number;
  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
}

// Playtests
interface Playtest {
  id: ID;
  status: PlaytestStatus;           // 'Assigned' | 'Completed'
  gameId: ID;                       // FK -> Game.id
  testerUserId: ID;                 // FK -> User.id

  creativityScale?: number | null;  // int 0–5
  artScale?: number | null;         // int 0–5
  moodScale?: number | null;        // int 0–5
  narrativeScale?: number | null;   // int 0–5
  enjoymentScale?: number | null;   // int 0–5

  doesWork?: boolean | null;
  createdAt?: ISODateTime;
}

// Ships (submission for shipping)
interface Ship {
  id: ID;

  codeUrl?: URL | null;
  playableUrl?: URL | null;

  howHeard?: string | null;
  doingWell?: string | null;
  improve?: string | null;

  birthday?: ISODate | null;

  firstName: string;
  lastName: string;
  email: Email;

  screenshotUrl?: URL | null;
  description?: string | null;
  githubUsername?: string | null;

  address1: string;
  address2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  zipCode: string;

  overrideHoursSpent?: number | null;
  overrideJustification?: string | null;

  yswsRecordId?: string | null;
  yswsSubmissionStatus?: YSWSSubmissionStatus | null;

  createdAt?: ISODateTime;
  updatedAt?: ISODateTime;
}
```