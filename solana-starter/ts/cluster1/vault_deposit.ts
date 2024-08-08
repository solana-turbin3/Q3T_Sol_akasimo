import {
  Connection,
  Keypair,
  SystemProgram,
  PublicKey,
  Commitment,
} from "@solana/web3.js";
import {
  Program,
  Wallet,
  AnchorProvider,
  Address,
  BN,
} from "@coral-xyz/anchor";
import { WbaVault, IDL } from "./programs/wba_vault";
import wallet from "./wallet/wba-wallet.json";

// Import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Commitment
const commitment: Commitment = "finalized";

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment,
});

// Create our program
const program = new Program<WbaVault>(
  IDL,
  "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as Address,
  provider,
);

// Create a random keypair
const vaultState = new PublicKey("BHbE7AQhDCsq11fjUTeLeYZTfkmeWpg2LKNMehLafjpE");
// Create the PDA for our enrollment account
const vaultAuth = [Buffer.from("auth"), vaultState.toBuffer()];
const [vaultAuthPda, _vaultAuthBump] = PublicKey.findProgramAddressSync(vaultAuth, program.programId);

// Create the vault key
const vault = [Buffer.from("vault"), Buffer.from(vaultAuthPda.toBuffer())];
const [vaultPda, _vaultBump] = PublicKey.findProgramAddressSync(vault, program.programId);


// Execute our enrollment transaction
(async () => {
  try {
    const signature = await program.methods
    .deposit(new BN(0.3333)    )
    .accounts({
       owner: keypair.publicKey,
       vaultState: vaultState,
       vaultAuth: vaultAuthPda,
       vault: vaultPda,
       systemProgram: SystemProgram.programId,
    })
    .signers([
        keypair
    ]).rpc();
    console.log(`Deposit success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);

    // ```
    // https://explorer.solana.com/tx/5d8vA3AM5RTopWb6VUdatxSoGmkYJQDqhamQMeQ6tHD7FiD9MA6aQAy4yHLBJWgNQnznDZwVaNf3cLb2V4Zh5FUS?cluster=devnet
    // ```
    
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
