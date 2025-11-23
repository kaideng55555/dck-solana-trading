import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { 
    createMint, 
    getOrCreateAssociatedTokenAccount, 
    mintTo,
    TOKEN_PROGRAM_ID,
    MINT_SIZE,
    getMinimumBalanceForRentExemptMint,
    createInitializeMintInstruction
} from '@solana/spl-token';

interface TokenCreationProps {
    onTokenCreated?: (mintAddress: string) => void;
}

export const TokenCreator: React.FC<TokenCreationProps> = ({ onTokenCreated }) => {
    const { connection } = useConnection();
    const { publicKey, signTransaction } = useWallet();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        symbol: '',
        decimals: 6,
        supply: 0,
        description: 'DCK$ TOOLS Token',
        website: 'https://dcktools.com',
        twitter: '@dcktools'
    });

    const [authorities, setAuthorities] = useState({
        revokeFreeze: false,
        revokeMint: false,
        revokeUpdate: false
    });

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAuthorityToggle = (authority: keyof typeof authorities) => {
        setAuthorities(prev => ({
            ...prev,
            [authority]: !prev[authority]
        }));
    };

    const calculateTotalCost = () => {
        let baseCost = 0.01; // Base token creation cost
        if (authorities.revokeFreeze) baseCost += 0.01;
        if (authorities.revokeMint) baseCost += 0.01;
        if (authorities.revokeUpdate) baseCost += 0.01;
        return baseCost;
    };

    const createToken = async () => {
        if (!publicKey || !signTransaction) {
            alert('Please connect your wallet first');
            return;
        }

        setIsCreating(true);
        
        try {
            console.log('🚀 Creating DCK token...');
            
            // Check wallet balance
            const balance = await connection.getBalance(publicKey);
            if (balance < 0.1 * 1e9) { // 0.1 SOL in lamports
                throw new Error('Insufficient SOL balance (minimum 0.1 SOL required)');
            }

            // Generate mint keypair
            const mintKeypair = Keypair.generate();
            console.log('🎯 Mint address:', mintKeypair.publicKey.toString());

            // Get minimum balance for rent exemption
            const mintRent = await getMinimumBalanceForRentExemptMint(connection);

            // Create mint account instruction
            const createAccountInstruction = SystemProgram.createAccount({
                fromPubkey: publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: MINT_SIZE,
                lamports: mintRent,
                programId: TOKEN_PROGRAM_ID,
            });

            // Initialize mint instruction with proper authority handling
            const initializeMintInstruction = createInitializeMintInstruction(
                mintKeypair.publicKey,
                formData.decimals,
                authorities.revokeMint ? publicKey : publicKey, // mint authority (we'll revoke later if needed)
                authorities.revokeFreeze ? publicKey : publicKey, // freeze authority (we'll revoke later if needed)
                TOKEN_PROGRAM_ID
            );

            // Create transaction
            const transaction = new Transaction().add(
                createAccountInstruction,
                initializeMintInstruction
            );

            // Get recent blockhash
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            // Partially sign with mint keypair
            transaction.partialSign(mintKeypair);

            // Sign with wallet
            const signedTransaction = await signTransaction(transaction);

            // Send transaction
            const signature = await connection.sendRawTransaction(
                signedTransaction.serialize()
            );

            await connection.confirmTransaction(signature);
            console.log('✅ Mint created! Signature:', signature);

            // Create associated token account
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                {
                    publicKey,
                    signTransaction,
                    signAllTransactions: async (txs) => {
                        return Promise.resolve(txs);
                    }
                } as any,
                mintKeypair.publicKey,
                publicKey
            );

            console.log('🏦 Token account created:', tokenAccount.address.toString());

            // Mint initial supply if specified
            if (formData.supply > 0) {
                console.log(`⚡ Minting ${formData.supply} tokens...`);
                
                const mintAmount = formData.supply * (10 ** formData.decimals);
                
                const mintSignature = await mintTo(
                    connection,
                    {
                        publicKey,
                        signTransaction,
                        signAllTransactions: async (txs) => {
                            return Promise.resolve(txs);
                        }
                    } as any,
                    mintKeypair.publicKey,
                    tokenAccount.address,
                    publicKey,
                    mintAmount
                );

                console.log('✅ Tokens minted! Signature:', mintSignature);
            }

            // Create success message
            const tokenInfo = {
                name: formData.name,
                symbol: formData.symbol,
                decimals: formData.decimals,
                supply: formData.supply,
                mintAddress: mintKeypair.publicKey.toString(),
                tokenAccount: tokenAccount.address.toString(),
                creator: publicKey.toString(),
                timestamp: new Date().toISOString()
            };

            // Save to localStorage for persistence
            const existingTokens = JSON.parse(localStorage.getItem('dck_created_tokens') || '[]');
            existingTokens.push(tokenInfo);
            localStorage.setItem('dck_created_tokens', JSON.stringify(existingTokens));

            alert(`🎉 Token created successfully!\nMint: ${mintKeypair.publicKey.toString()}`);
            
            if (onTokenCreated) {
                onTokenCreated(mintKeypair.publicKey.toString());
            }

            // Reset form
            setFormData({
                name: '',
                symbol: '',
                decimals: 6,
                supply: 0,
                description: 'DCK$ TOOLS Token',
                website: 'https://dcktools.com',
                twitter: '@dcktools'
            });

        } catch (error) {
            console.error('❌ Token creation failed:', error);
            alert(`Token creation failed: ${(error as Error).message}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="token-creator dck-panel">
            <div className="panel-header">
                <h2>🎯 DCK Token Creator</h2>
                <p>Create your own SPL tokens with DCK styling</p>
            </div>

            <div className="creator-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Token Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="e.g., DCK Coin"
                            className="dck-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Symbol</label>
                        <input
                            type="text"
                            value={formData.symbol}
                            onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                            placeholder="e.g., DCK"
                            className="dck-input"
                            maxLength={10}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Decimals</label>
                        <input
                            type="number"
                            value={formData.decimals}
                            onChange={(e) => handleInputChange('decimals', parseInt(e.target.value))}
                            min="0"
                            max="9"
                            className="dck-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Initial Supply</label>
                        <input
                            type="number"
                            value={formData.supply}
                            onChange={(e) => handleInputChange('supply', parseFloat(e.target.value))}
                            placeholder="1000000"
                            className="dck-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your token..."
                        className="dck-input"
                        rows={3}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Website</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            placeholder="https://yourproject.com"
                            className="dck-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>Twitter</label>
                        <input
                            type="text"
                            value={formData.twitter}
                            onChange={(e) => handleInputChange('twitter', e.target.value)}
                            placeholder="@yourproject"
                            className="dck-input"
                        />
                    </div>
                </div>

                {/* Authority Revocation Section */}
                <div className="authorities-section">
                    <h3>🔒 Revoke Authorities</h3>
                    <p className="authorities-description">
                        Solana Token has 3 authorities: Freeze Authority, Mint Authority, and Update Authority. 
                        Revoke them to attract more investors.
                    </p>
                    
                    <div className="authority-toggles">
                        <div className="authority-option">
                            <div className="authority-info">
                                <div className="authority-icon">❄️</div>
                                <div className="authority-details">
                                    <h4>Revoke Freeze</h4>
                                    <p>No one will be able to freeze holders' token accounts anymore</p>
                                    <span className="cost">+0.01 SOL</span>
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={authorities.revokeFreeze}
                                    onChange={() => handleAuthorityToggle('revokeFreeze')}
                                    title="Toggle freeze authority revocation"
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="authority-option">
                            <div className="authority-info">
                                <div className="authority-icon">🪙</div>
                                <div className="authority-details">
                                    <h4>Revoke Mint</h4>
                                    <p>No one will be able to create more tokens anymore</p>
                                    <span className="cost">+0.01 SOL</span>
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={authorities.revokeMint}
                                    onChange={() => handleAuthorityToggle('revokeMint')}
                                    title="Toggle mint authority revocation"
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="authority-option">
                            <div className="authority-info">
                                <div className="authority-icon">✏️</div>
                                <div className="authority-details">
                                    <h4>Revoke Update</h4>
                                    <p>No one will be able to modify token metadata anymore</p>
                                    <span className="cost">+0.01 SOL</span>
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={authorities.revokeUpdate}
                                    onChange={() => handleAuthorityToggle('revokeUpdate')}
                                    title="Toggle update authority revocation"
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="authority-summary">
                        <p>Selected authorities will be revoked during token creation.</p>
                        <div className="total-cost">
                            Total Cost: {calculateTotalCost().toFixed(3)} SOL
                        </div>
                    </div>
                </div>

                <div className="creator-actions">
                    <button
                        onClick={createToken}
                        disabled={isCreating || !publicKey || !formData.name || !formData.symbol}
                        className="dck-button primary"
                    >
                        {isCreating ? (
                            <>⏳ Creating Token...</>
                        ) : (
                            <>🚀 Create Token</>
                        )}
                    </button>
                </div>

                {!publicKey && (
                    <div className="wallet-warning">
                        <p>⚠️ Connect your wallet to create tokens</p>
                    </div>
                )}

                <div className="creator-info">
                    <h4>📋 Requirements:</h4>
                    <ul>
                        <li>Minimum 0.1 SOL in wallet</li>
                        <li>Connected Solana wallet</li>
                        <li>Network: {connection.rpcEndpoint.includes('devnet') ? 'Devnet' : connection.rpcEndpoint.includes('quiknode') ? 'Mainnet (QuickNode)' : 'Mainnet'}</li>
                    </ul>
                </div>
            </div>

            <style jsx>{`
                .token-creator {
                    margin-bottom: 20px;
                    border: 1px solid #00ffff;
                    border-radius: 15px;
                    padding: 25px;
                    background: linear-gradient(135deg, rgba(0, 5, 15, 0.95), rgba(0, 10, 20, 0.9));
                    backdrop-filter: blur(10px);
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.2), inset 0 0 30px rgba(0, 255, 255, 0.05);
                    position: relative;
                    overflow: hidden;
                }

                .token-creator::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
                    animation: scan 3s infinite;
                }

                @keyframes scan {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }

                .panel-header {
                    text-align: center;
                    margin-bottom: 25px;
                }

                .panel-header h2 {
                    color: #00ffff;
                    text-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff;
                    margin: 0 0 10px 0;
                    font-family: 'Courier New', monospace;
                    font-weight: 900;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    background: linear-gradient(45deg, #00ffff, #ff00ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .creator-form {
                    max-width: 600px;
                    margin: 0 auto;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    color: #00bfff;
                    font-weight: bold;
                    margin-bottom: 8px;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 0 10px #00bfff;
                }

                .dck-input {
                    background: rgba(0, 5, 15, 0.8);
                    border: 1px solid #00bfff;
                    border-radius: 6px;
                    padding: 12px 16px;
                    color: #00ffff;
                    font-size: 14px;
                    font-family: 'Courier New', monospace;
                    transition: all 0.4s ease;
                    box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.1);
                    position: relative;
                }

                .dck-input:focus {
                    outline: none;
                    border-color: #ff00ff;
                    box-shadow: 0 0 20px rgba(255, 0, 255, 0.5), inset 0 0 20px rgba(255, 0, 255, 0.1);
                    color: #ffffff;
                    background: rgba(10, 0, 20, 0.9);
                }

                .dck-input::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                }

                textarea.dck-input {
                    resize: vertical;
                    min-height: 80px;
                }

                .creator-actions {
                    text-align: center;
                    margin: 25px 0;
                }

                .dck-button {
                    background: linear-gradient(135deg, #00ffff, #ff00ff, #00ffff);
                    background-size: 300% 300%;
                    animation: gradientShift 3s ease infinite;
                    border: 1px solid #00ffff;
                    border-radius: 12px;
                    padding: 15px 40px;
                    color: #000000;
                    font-weight: 900;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .dck-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                    transition: left 0.5s ease;
                }

                .dck-button:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 40px rgba(255, 0, 255, 0.6);
                    color: #ffffff;
                    text-shadow: 0 0 10px #ffffff;
                }

                .dck-button:hover:not(:disabled)::before {
                    left: 100%;
                }

                .dck-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .wallet-warning {
                    background: rgba(255, 165, 0, 0.2);
                    border: 1px solid orange;
                    border-radius: 8px;
                    padding: 15px;
                    text-align: center;
                    color: orange;
                    margin: 20px 0;
                }

                .creator-info {
                    margin-top: 25px;
                    padding: 15px;
                    background: rgba(0, 191, 255, 0.1);
                    border-radius: 8px;
                    border: 1px solid var(--dck-cyan);
                }

                .creator-info h4 {
                    color: var(--dck-cyan);
                    margin: 0 0 10px 0;
                }

                .creator-info ul {
                    margin: 0;
                    padding-left: 20px;
                }

                .creator-info li {
                    color: white;
                    margin-bottom: 5px;
                }

                .authorities-section {
                    margin: 30px 0;
                    padding: 25px;
                    background: linear-gradient(135deg, rgba(0, 10, 25, 0.9), rgba(10, 0, 20, 0.8));
                    border: 1px solid #00ffff;
                    border-radius: 15px;
                    box-shadow: 0 0 40px rgba(0, 255, 255, 0.15), inset 0 0 20px rgba(0, 255, 255, 0.05);
                    position: relative;
                    backdrop-filter: blur(15px);
                }

                .authorities-section::before {
                    content: '';
                    position: absolute;
                    top: -1px;
                    left: -1px;
                    right: -1px;
                    bottom: -1px;
                    background: linear-gradient(45deg, #00ffff, #ff00ff, #00ffff);
                    border-radius: 15px;
                    z-index: -1;
                    opacity: 0.3;
                }

                .authorities-section h3 {
                    color: #00ffff;
                    margin: 0 0 15px 0;
                    text-shadow: 0 0 15px #00ffff, 0 0 30px #00ffff;
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                .authorities-description {
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 20px;
                    font-size: 14px;
                }

                .authority-toggles {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .authority-option {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 18px;
                    background: linear-gradient(135deg, rgba(0, 5, 20, 0.7), rgba(5, 0, 15, 0.6));
                    border: 1px solid rgba(0, 255, 255, 0.4);
                    border-radius: 12px;
                    transition: all 0.4s ease;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(5px);
                }

                .authority-option::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
                    transition: left 0.5s ease;
                }

                .authority-option:hover {
                    border-color: #ff00ff;
                    background: linear-gradient(135deg, rgba(0, 10, 30, 0.8), rgba(20, 0, 30, 0.7));
                    box-shadow: 0 0 25px rgba(255, 0, 255, 0.3);
                    transform: translateY(-2px);
                }

                .authority-option:hover::before {
                    left: 100%;
                }

                .authority-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex: 1;
                }

                .authority-icon {
                    font-size: 28px;
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(0, 255, 255, 0.3), rgba(255, 0, 255, 0.2));
                    border: 1px solid #00ffff;
                    border-radius: 50%;
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
                    position: relative;
                }

                .authority-icon::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, #00ffff, #ff00ff);
                    border-radius: 50%;
                    z-index: -1;
                    opacity: 0.6;
                    animation: rotate 3s linear infinite;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .authority-details h4 {
                    color: #00ffff;
                    margin: 0 0 6px 0;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    text-shadow: 0 0 10px #00ffff;
                    letter-spacing: 1px;
                }

                .authority-details p {
                    color: rgba(255, 255, 255, 0.8);
                    margin: 0 0 8px 0;
                    font-size: 12px;
                    line-height: 1.5;
                    font-family: 'Courier New', monospace;
                }

                .authority-details .cost {
                    color: #ff00ff;
                    font-size: 11px;
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 0 8px #ff00ff;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 26px;
                }

                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(0, 20, 40, 0.8), rgba(20, 0, 40, 0.6));
                    transition: all 0.4s ease;
                    border-radius: 26px;
                    border: 1px solid #00bfff;
                    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
                }

                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background: linear-gradient(135deg, #ffffff, #00ffff);
                    transition: all 0.4s ease;
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                }

                input:checked + .toggle-slider {
                    background: linear-gradient(135deg, #00ffff, #ff00ff);
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.6), inset 0 0 10px rgba(255, 0, 255, 0.3);
                    border-color: #ff00ff;
                }

                input:checked + .toggle-slider:before {
                    transform: translateX(24px);
                    background: linear-gradient(135deg, #ffffff, #ff00ff);
                    box-shadow: 0 0 15px rgba(255, 0, 255, 0.8);
                }

                .authority-summary {
                    margin-top: 25px;
                    padding: 20px;
                    background: linear-gradient(135deg, rgba(255, 0, 255, 0.15), rgba(0, 255, 255, 0.1));
                    border: 1px solid #ff00ff;
                    border-radius: 12px;
                    box-shadow: 0 0 25px rgba(255, 0, 255, 0.2);
                    position: relative;
                }

                .authority-summary::before {
                    content: '';
                    position: absolute;
                    top: -1px;
                    left: -1px;
                    right: -1px;
                    bottom: -1px;
                    background: linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff);
                    border-radius: 12px;
                    z-index: -1;
                    opacity: 0.3;
                    animation: borderPulse 2s ease-in-out infinite alternate;
                }

                @keyframes borderPulse {
                    from { opacity: 0.3; }
                    to { opacity: 0.6; }
                }

                .authority-summary p {
                    color: rgba(255, 255, 255, 0.9);
                    margin: 0 0 12px 0;
                    font-size: 13px;
                    font-family: 'Courier New', monospace;
                    text-align: center;
                }

                .total-cost {
                    color: #ff00ff;
                    font-weight: 900;
                    font-size: 18px;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 0 15px #ff00ff;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .creator-form {
                        max-width: 100%;
                    }

                    .authority-option {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }

                    .authority-info {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default TokenCreator;