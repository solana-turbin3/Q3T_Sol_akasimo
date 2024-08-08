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

import wallet from "../wba-wallet.json";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

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

const token_decimals = 10_000_000n;

// Mint address
const mint = new PublicKey("6YXfBVkLeGfLm5G5tC4qbaHaGWViMjsXJK8seBSKYFjZ");

// Execute our enrollment transaction
(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const ownerAta = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        keypair.publicKey
    );
    console.log(`Your owner ata is: ${ownerAta.address.toBase58()}`);
    // Get the token account of the fromWallet address, and if it does not exist, create it
    const vaultAta = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        mint,
        vaultPda,
        true
    );
    console.log(`Your vault ata is: ${vaultAta.address.toBase58()}`);
    const signature = await program.methods
    .depositSpl(new BN(token_decimals))
    .accounts({
        owner: keypair.publicKey,
        ownerAta: ownerAta.address,
        vaultState: vaultState,
        vaultAuth: vaultAuthPda,
        vaultAta: vaultAta.address,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([
        keypair
    ]).rpc();
    console.log(`Deposit success! Check out your TX here:\n\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`);
    
    // ```
    // Oops, something went wrong: AnchorError caused by account: vault_ata. Error Code: ConstraintTokenOwner. Error Number: 2015. Error Message: A token owner constraint was violated.
    // ```

  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();
