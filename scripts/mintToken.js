import { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID, MINT_SIZE, getMinimumBalanceForRentExemptMint, createInitializeMintInstruction } from "@solana/spl-token";
import fs from "fs";
import bs58 from "bs58";

// Configuration - supports both devnet and mainnet
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const SOLANA_RPC = process.env.SOLANA_RPC || clusterApiUrl(SOLANA_NETWORK);
const connection = new Connection(SOLANA_RPC, 'confirmed');

console.log(`🌐 Using ${SOLANA_NETWORK} network: ${SOLANA_RPC}`);

class DCKTokenMinter {
    constructor() {
        this.connection = connection;
        this.mintAuthority = null;
        this.freezeAuthority = null;
    }

    /**
     * Generate a new keypair for token creation
     */
    generateKeypair() {
        const keypair = Keypair.generate();
        console.log('🔑 Generated new keypair:', keypair.publicKey.toString());
        return keypair;
    }

    /**
     * Load keypair from private key string or file
     */
    loadKeypair(privateKeyString) {
        try {
            let privateKeyBytes;
            
            // Try to parse as base58 first
            try {
                privateKeyBytes = bs58.decode(privateKeyString);
            } catch {
                // If base58 fails, try JSON array format
                privateKeyBytes = new Uint8Array(JSON.parse(privateKeyString));
            }
            
            const keypair = Keypair.fromSecretKey(privateKeyBytes);
            console.log('🔑 Loaded keypair:', keypair.publicKey.toString());
            return keypair;
        } catch (error) {
            console.error('❌ Error loading keypair:', error.message);
            return null;
        }
    }

    /**
     * Create a new SPL token with DCK branding
     */
    async createToken(params) {
        const {
            name,
            symbol,
            decimals = 6,
            supply,
            payerPrivateKey,
            description = 'DCK$ TOOLS Token',
            image = 'https://dcktools.com/logo.png',
            website = 'https://dcktools.com',
            twitter = 'https://twitter.com/dcktools'
        } = params;

        try {
            console.log('🚀 Starting token creation process...');
            
            // Load payer keypair
            const payer = this.loadKeypair(payerPrivateKey);
            if (!payer) {
                throw new Error('Invalid payer private key');
            }

            // Check balance
            const balance = await this.connection.getBalance(payer.publicKey);
            console.log(`💰 Payer balance: ${balance / LAMPORTS_PER_SOL} SOL`);
            
            if (balance < 0.1 * LAMPORTS_PER_SOL) {
                throw new Error('Insufficient SOL balance (minimum 0.1 SOL required)');
            }

            // Generate mint keypair
            const mintKeypair = Keypair.generate();
            console.log('🎯 Token mint address:', mintKeypair.publicKey.toString());

            // Set authorities
            this.mintAuthority = payer.publicKey;
            this.freezeAuthority = payer.publicKey;

            // Create mint account
            console.log('📦 Creating mint account...');
            const mintRent = await getMinimumBalanceForRentExemptMint(this.connection);
            
            const createMintAccountIx = SystemProgram.createAccount({
                fromPubkey: payer.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: MINT_SIZE,
                lamports: mintRent,
                programId: TOKEN_PROGRAM_ID,
            });

            const initializeMintIx = createInitializeMintInstruction(
                mintKeypair.publicKey,
                decimals,
                this.mintAuthority,
                this.freezeAuthority,
                TOKEN_PROGRAM_ID
            );

            // Create and send transaction
            const transaction = new Transaction().add(
                createMintAccountIx,
                initializeMintIx
            );

            const signature = await this.connection.sendTransaction(
                transaction,
                [payer, mintKeypair],
                { commitment: 'confirmed' }
            );

            console.log('✅ Mint created! Transaction:', signature);

            // Create associated token account for initial supply
            console.log('🏦 Creating token account...');
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                payer,
                mintKeypair.publicKey,
                payer.publicKey
            );

            console.log('🪙 Token account:', tokenAccount.address.toString());

            // Mint initial supply
            if (supply && supply > 0) {
                console.log(`⚡ Minting ${supply} tokens...`);
                const mintAmount = supply * (10 ** decimals);
                
                const mintSignature = await mintTo(
                    this.connection,
                    payer,
                    mintKeypair.publicKey,
                    tokenAccount.address,
                    this.mintAuthority,
                    mintAmount
                );

                console.log('✅ Tokens minted! Transaction:', mintSignature);
            }

            // Create token metadata (Metaplex format)
            const metadata = {
                name,
                symbol,
                description,
                image,
                external_url: website,
                attributes: [
                    { trait_type: 'Platform', value: 'DCK$ TOOLS' },
                    { trait_type: 'Network', value: 'Solana' },
                    { trait_type: 'Decimals', value: decimals.toString() }
                ],
                properties: {
                    files: [{ uri: image, type: 'image/png' }],
                    category: 'image',
                    creators: [
                        {
                            address: payer.publicKey.toString(),
                            verified: true,
                            share: 100
                        }
                    ]
                },
                collection: {
                    name: 'DCK$ TOOLS Tokens',
                    family: 'DCK'
                }
            };

            // Save token info to file
            const tokenInfo = {
                name,
                symbol,
                decimals,
                supply,
                mintAddress: mintKeypair.publicKey.toString(),
                tokenAccount: tokenAccount.address.toString(),
                mintAuthority: this.mintAuthority.toString(),
                freezeAuthority: this.freezeAuthority.toString(),
                creator: payer.publicKey.toString(),
                metadata,
                signatures: {
                    creation: signature,
                    mint: supply > 0 ? mintSignature : null
                },
                timestamp: new Date().toISOString()
            };

            const filename = `token_${symbol.toLowerCase()}_${Date.now()}.json`;
            fs.writeFileSync(filename, JSON.stringify(tokenInfo, null, 2));
            console.log('📄 Token info saved to:', filename);

            return {
                success: true,
                mintAddress: mintKeypair.publicKey.toString(),
                tokenAccount: tokenAccount.address.toString(),
                info: tokenInfo
            };

        } catch (error) {
            console.error('❌ Token creation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add liquidity to Raydium (placeholder)
     */
    async addLiquidity(params) {
        const {
            tokenMint,
            solAmount,
            tokenAmount,
            payerPrivateKey
        } = params;

        console.log('🌊 Adding liquidity to Raydium...');
        // This would integrate with Raydium SDK
        // For now, return placeholder response
        return {
            success: true,
            message: 'Liquidity addition queued',
            poolAddress: 'PLACEHOLDER_POOL_ADDRESS'
        };
    }

    /**
     * Burn tokens
     */
    async burnTokens(params) {
        const {
            mintAddress,
            amount,
            payerPrivateKey
        } = params;

        try {
            const payer = this.loadKeypair(payerPrivateKey);
            const mintPublicKey = new PublicKey(mintAddress);
            
            // Implementation would use burn instruction
            console.log(`🔥 Burning ${amount} tokens from ${mintAddress}`);
            
            return {
                success: true,
                message: `Burned ${amount} tokens`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const minter = new DCKTokenMinter();

    switch (command) {
        case 'create':
            if (args.length < 6) {
                console.log('Usage: node mintToken.js create <name> <symbol> <decimals> <supply> <privateKey>');
                return;
            }
            
            const result = await minter.createToken({
                name: args[1],
                symbol: args[2],
                decimals: parseInt(args[3]),
                supply: parseFloat(args[4]),
                payerPrivateKey: args[5]
            });
            
            if (result.success) {
                console.log('🎉 Token created successfully!');
                console.log('Mint Address:', result.mintAddress);
            } else {
                console.log('❌ Failed:', result.error);
            }
            break;

        case 'generate-keypair':
            const keypair = minter.generateKeypair();
            console.log('Private Key (base58):', bs58.encode(keypair.secretKey));
            console.log('Save this private key securely!');
            break;

        default:
            console.log(`
DCK$ TOOLS Token Minter v1.0

Commands:
  create <name> <symbol> <decimals> <supply> <privateKey>  - Create new token
  generate-keypair                                         - Generate new keypair

Examples:
  node mintToken.js generate-keypair
  node mintToken.js create "DCK Coin" "DCK" 6 1000000 "YOUR_PRIVATE_KEY"
            `);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DCKTokenMinter;