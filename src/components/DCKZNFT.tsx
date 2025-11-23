import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, Vector3, Color } from 'three';
import { Text, OrbitControls, Environment } from '@react-three/drei';

interface DCKZCharacterProps {
    variant: 'cyber' | 'neon' | 'street' | 'vip';
    animation: 'idle' | 'dance' | 'celebrate' | 'trade' | 'moonwalk';
    tokenAddress?: string;
    price?: number;
}

// DCKZ Character Variants
const DCKZ_VARIANTS = {
    cyber: {
        primary: '#00bfff',
        secondary: '#0080ff',
        accent: '#ffffff',
        body: '#1a1a1a',
        eyes: '#00ffff',
        outfit: 'tech'
    },
    neon: {
        primary: '#ff0080',
        secondary: '#ff00ff',
        accent: '#00ff80',
        body: '#2d1b69',
        eyes: '#ff0080',
        outfit: 'street'
    },
    street: {
        primary: '#ffaa00',
        secondary: '#ff6600',
        accent: '#fff000',
        body: '#1a1a1a',
        eyes: '#ffaa00',
        outfit: 'urban'
    },
    vip: {
        primary: '#ffd700',
        secondary: '#ffaa00',
        accent: '#ffffff',
        body: '#2d1b69',
        eyes: '#ffd700',
        outfit: 'luxury'
    }
};

// Animated DCKZ Character Component
const DCKZCharacter: React.FC<DCKZCharacterProps> = ({ 
    variant, 
    animation, 
    tokenAddress, 
    price 
}) => {
    const meshRef = useRef<any>();
    const [time, setTime] = useState(0);
    const colors = DCKZ_VARIANTS[variant];

    useFrame((state, delta) => {
        setTime(time + delta);
        
        if (meshRef.current) {
            switch (animation) {
                case 'dance':
                    meshRef.current.rotation.y = Math.sin(time * 2) * 0.3;
                    meshRef.current.position.y = Math.sin(time * 4) * 0.1;
                    break;
                case 'celebrate':
                    meshRef.current.rotation.y = time;
                    meshRef.current.position.y = Math.sin(time * 3) * 0.2 + 0.1;
                    break;
                case 'trade':
                    meshRef.current.rotation.x = Math.sin(time * 1.5) * 0.1;
                    meshRef.current.position.y = Math.sin(time * 2) * 0.05;
                    break;
                case 'moonwalk':
                    meshRef.current.position.x = Math.sin(time) * 0.5;
                    meshRef.current.rotation.y = -time * 0.5;
                    break;
                default: // idle
                    meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
                    meshRef.current.position.y = Math.sin(time * 2) * 0.02;
            }
        }
    });

    return (
        <group ref={meshRef}>
            {/* Body */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 1.5, 0.5]} />
                <meshStandardMaterial color={colors.body} />
            </mesh>
            
            {/* Head */}
            <mesh position={[0, 1, 0]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshStandardMaterial color={colors.primary} />
            </mesh>
            
            {/* Eyes */}
            <mesh position={[-0.15, 1.1, 0.35]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial color={colors.eyes} />
            </mesh>
            <mesh position={[0.15, 1.1, 0.35]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial color={colors.eyes} />
            </mesh>
            
            {/* Arms */}
            <mesh position={[-0.75, 0.3, 0]} rotation={[0, 0, Math.sin(time * 3) * 0.3]}>
                <cylinderGeometry args={[0.1, 0.1, 1]} />
                <meshStandardMaterial color={colors.secondary} />
            </mesh>
            <mesh position={[0.75, 0.3, 0]} rotation={[0, 0, -Math.sin(time * 3) * 0.3]}>
                <cylinderGeometry args={[0.1, 0.1, 1]} />
                <meshStandardMaterial color={colors.secondary} />
            </mesh>
            
            {/* Legs */}
            <mesh position={[-0.25, -1, 0]} rotation={[Math.sin(time * 4) * 0.2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 1]} />
                <meshStandardMaterial color={colors.body} />
            </mesh>
            <mesh position={[0.25, -1, 0]} rotation={[-Math.sin(time * 4) * 0.2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 1]} />
                <meshStandardMaterial color={colors.body} />
            </mesh>
            
            {/* Accessories based on variant */}
            {variant === 'vip' && (
                <mesh position={[0, 1.5, 0]}>
                    <coneGeometry args={[0.3, 0.2, 6]} />
                    <meshStandardMaterial color="#ffd700" />
                </mesh>
            )}
            
            {variant === 'cyber' && (
                <mesh position={[0, 0.8, 0.4]}>
                    <boxGeometry args={[0.6, 0.1, 0.1]} />
                    <meshBasicMaterial color="#00ffff" />
                </mesh>
            )}
            
            {/* Price display if provided */}
            {price && (
                <Text
                    position={[0, -2, 0]}
                    fontSize={0.2}
                    color={colors.accent}
                    anchorX="center"
                    anchorY="middle"
                >
                    ${price.toFixed(6)}
                </Text>
            )}
            
            {/* Token address display */}
            {tokenAddress && (
                <Text
                    position={[0, -2.5, 0]}
                    fontSize={0.1}
                    color={colors.secondary}
                    anchorX="center"
                    anchorY="middle"
                >
                    {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-4)}
                </Text>
            )}
        </group>
    );
};

// Main NFT Animation Component
interface DCKZNFTProps {
    tokenData?: {
        address: string;
        price: number;
        change24h: number;
        volume: number;
    };
    size?: 'small' | 'medium' | 'large';
    autoRotate?: boolean;
}

export const DCKZNFT: React.FC<DCKZNFTProps> = ({ 
    tokenData, 
    size = 'medium', 
    autoRotate = true 
}) => {
    const [variant, setVariant] = useState<DCKZCharacterProps['variant']>('neon');
    const [animation, setAnimation] = useState<DCKZCharacterProps['animation']>('idle');

    // Determine variant based on token performance
    useEffect(() => {
        if (tokenData) {
            if (tokenData.change24h > 50) {
                setVariant('vip');
                setAnimation('celebrate');
            } else if (tokenData.change24h > 10) {
                setVariant('cyber');
                setAnimation('dance');
            } else if (tokenData.change24h > 0) {
                setVariant('neon');
                setAnimation('trade');
            } else {
                setVariant('street');
                setAnimation('idle');
            }
        }
    }, [tokenData]);

    const sizeConfig = {
        small: { width: 200, height: 200 },
        medium: { width: 300, height: 300 },
        large: { width: 500, height: 500 }
    };

    const currentSize = sizeConfig[size];

    return (
        <div className="dckz-nft-container" style={{ 
            width: currentSize.width, 
            height: currentSize.height 
        }}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                style={{ borderRadius: '15px' }}
            >
                <Environment preset="city" />
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={0.8} />
                <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff0080" />
                
                <DCKZCharacter
                    variant={variant}
                    animation={animation}
                    tokenAddress={tokenData?.address}
                    price={tokenData?.price}
                />
                
                {autoRotate && <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />}
            </Canvas>
            
            {tokenData && (
                <div className="nft-overlay">
                    <div className="performance-indicator">
                        <span className={`change ${tokenData.change24h >= 0 ? 'positive' : 'negative'}`}>
                            {tokenData.change24h >= 0 ? '+' : ''}{tokenData.change24h.toFixed(2)}%
                        </span>
                    </div>
                </div>
            )}

            <style jsx>{`
                .dckz-nft-container {
                    position: relative;
                    border: 2px solid var(--dck-pink);
                    border-radius: 15px;
                    overflow: hidden;
                    background: radial-gradient(circle, rgba(0,0,0,0.9) 0%, rgba(45,27,105,0.3) 100%);
                    box-shadow: 0 0 30px rgba(255, 0, 128, 0.3);
                }

                .nft-overlay {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    z-index: 10;
                }

                .performance-indicator {
                    background: rgba(0, 0, 0, 0.8);
                    padding: 5px 10px;
                    border-radius: 15px;
                    border: 1px solid var(--dck-cyan);
                }

                .change.positive {
                    color: #00ff80;
                    text-shadow: 0 0 10px #00ff80;
                }

                .change.negative {
                    color: #ff4444;
                    text-shadow: 0 0 10px #ff4444;
                }

                .change {
                    font-weight: bold;
                    font-size: 12px;
                }
            `}</style>
        </div>
    );
};

// NFT Collection Gallery
interface DCKZGalleryProps {
    tokens: Array<{
        address: string;
        price: number;
        change24h: number;
        volume: number;
        symbol: string;
    }>;
}

export const DCKZGallery: React.FC<DCKZGalleryProps> = ({ tokens }) => {
    const [selectedToken, setSelectedToken] = useState<string | null>(null);

    return (
        <div className="dckz-gallery">
            <div className="gallery-header">
                <h2>🎨 DCKZ NFT Collection</h2>
                <p>Animated NFTs that reflect your token's performance</p>
            </div>

            <div className="gallery-grid">
                {tokens.map((token, index) => (
                    <div 
                        key={token.address}
                        className={`nft-card ${selectedToken === token.address ? 'selected' : ''}`}
                        onClick={() => setSelectedToken(selectedToken === token.address ? null : token.address)}
                    >
                        <DCKZNFT
                            tokenData={token}
                            size="medium"
                            autoRotate={selectedToken === token.address}
                        />
                        <div className="nft-info">
                            <h4>{token.symbol}</h4>
                            <p>${token.price.toFixed(6)}</p>
                            <p>Vol: ${(token.volume / 1000).toFixed(1)}K</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedToken && (
                <div className="nft-detail-modal">
                    <div className="modal-content">
                        <button 
                            className="close-button"
                            onClick={() => setSelectedToken(null)}
                        >
                            ✕
                        </button>
                        <DCKZNFT
                            tokenData={tokens.find(t => t.address === selectedToken)}
                            size="large"
                            autoRotate={true}
                        />
                    </div>
                </div>
            )}

            <style jsx>{`
                .dckz-gallery {
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.9);
                    border-radius: 15px;
                    border: 2px solid var(--dck-cyan);
                    margin: 20px 0;
                }

                .gallery-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .gallery-header h2 {
                    color: var(--dck-cyan);
                    text-shadow: 0 0 15px var(--dck-cyan);
                    margin: 0 0 10px 0;
                }

                .gallery-header p {
                    color: var(--dck-pink);
                    margin: 0;
                }

                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .nft-card {
                    background: rgba(0, 0, 0, 0.7);
                    border: 1px solid var(--dck-pink);
                    border-radius: 15px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                .nft-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(255, 0, 128, 0.4);
                    border-color: var(--dck-cyan);
                }

                .nft-card.selected {
                    border-color: var(--dck-cyan);
                    box-shadow: 0 0 30px rgba(0, 191, 255, 0.5);
                }

                .nft-info {
                    margin-top: 15px;
                }

                .nft-info h4 {
                    color: var(--dck-cyan);
                    margin: 0 0 5px 0;
                    font-size: 16px;
                }

                .nft-info p {
                    color: white;
                    margin: 2px 0;
                    font-size: 14px;
                }

                .nft-detail-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    position: relative;
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.95);
                    border: 2px solid var(--dck-cyan);
                    border-radius: 20px;
                }

                .close-button {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: var(--dck-pink);
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 10;
                }

                .close-button:hover {
                    color: var(--dck-cyan);
                    text-shadow: 0 0 10px var(--dck-cyan);
                }

                @media (max-width: 768px) {
                    .gallery-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default DCKZNFT;