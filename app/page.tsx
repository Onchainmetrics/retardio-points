'use client';
import * as React from 'react';
import * as web3 from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import '98.css';

// Token definitions
interface TokenConfig {
    mint: string;
    symbol: string;
    decimals?: number;
}

const TOKENS: { [key: string]: TokenConfig } = {
    RETARDIO: {
        mint: '6ogzHhzdrQr9Pgv6hZ2MNze7UrzBMAFyBBWUYp1Fhitx',
        symbol: 'RETARDIO'
    },
    XD: {
        mint: 'DEJiPKx5GActUtB6qUssreUxkhXtL4hTQAAJZ7Ccw8se',
        symbol: 'XD'
    },
    NIGGABUTT: {
        mint: '8fZL148nnC168RAVCZh4PkjvMZmxMEfMLDhoziWVPnqf',
        symbol: 'NiggaButt'
    },
    AUTISM: {
        mint: 'BkVeSP2GsXV3AYoRJBSZTpFE8sXmcuGnRQcFgoWspump',
        symbol: 'autism'
    },
    MLG: {
        mint: '7XJiwLDrjzxDYdZipnJXzpr1iDTmK55XixSFAa7JgNEL',
        symbol: 'MLG'
    },
    RAPR: {
        mint: 'RAPRz9fd87y9qcBGj1VVqUbbUM6DaBggSDA58zc3N2b',
        symbol: 'RAPR'
    },
    YAKUB: {
        mint: '7iagMTDPfNSR5zVcERT1To7A9eaQoz58dJAh42EMHcCC',
        symbol: 'YAKUB'
    },
    GLORP: {
        mint: 'FkBF9u1upwEMUPxnXjcydxxVSxgr8f3k1YXbz7G7bmtA',
        symbol: 'glorp'
    },
    FLOYDAI: {
        mint: 'J7tYmq2JnQPvxyhcXpCDrvJnc9R5ts8rv7tgVHDPsw7U',
        symbol: 'FLOYDAI'
    },
    BPD: {
        mint: 'AMzgo1nUni2rDwGWEaWSFVtQdAB3h7kD9zKMSXNK45aY',
        symbol: 'BPD'
    },
    UWU: {
        mint: 'UwU8RVXB69Y6Dcju6cN2Qef6fykkq6UUNpB15rZku6Z',
        symbol: 'UWU'
    }
};

const RETARDIO_COUSINS_ADDRESS = 'DUX8SZXLKigc84BBUcYjA7PuKe2SFwXFtQVgwmBsaXKm';

interface TokenBalances {
    [key: string]: number;
}

interface ScoreBreakdown {
    category: string;
    points: number;
    explanation: string;
}

interface ScoreResult {
    points: number;
    titles: string[];
    breakdowns: ScoreBreakdown[];
}

interface ScoringConfig {
    nftTiers: {
        threshold: number;
        multiplier: number;
        title: string;
    }[];
    tokenTiers: {
        tier1: string[];
        tier2: string[];
        tier3: string[];
        weights: {
            tier1: number;
            tier2: number;
            tier3: number;
        };
    };
    pointsNormalizer: number;
}

const SCORING_CONFIG: ScoringConfig = {
    nftTiers: [
        { threshold: 1, multiplier: 1.025, title: "Schizo Apprentice" },
        { threshold: 5, multiplier: 1.05, title: "Based Department" },
        { threshold: 10, multiplier: 1.1, title: "Mitch Fanboy" },
        { threshold: 50, multiplier: 2.0, title: "Supreme Autist" }
    ],
    tokenTiers: {
        tier1: ['RETARDIO'],
        tier2: ['XD', 'AUTISM', 'GLORP'],
        tier3: ['NIGGABUTT', 'MLG', 'RAPR', 'YAKUB', 'FLOYDAI', 'BPD', 'UWU'],
        weights: {
            tier1: 1.5,
            tier2: 1.05,
            tier3: 1.1
        }
    },
    pointsNormalizer: 1000
};

function calculateTokenPoints(token: string, balance: number): number {
    if (balance <= 0) return 0;
    
    // Supply normalization
    let normalizedBalance = balance;
    if (token === 'RAPR') {
        normalizedBalance = balance * 2000;
    } else if (token === 'UWU') {
        normalizedBalance = balance / 15;
    }
    
    // Reduce base points by half to lower overall scores
    const basePoints = Math.log10(normalizedBalance + 1) * 1500;
    
    // Get tier weight
    let weight;
    if (SCORING_CONFIG.tokenTiers.tier1.includes(token)) {
        weight = SCORING_CONFIG.tokenTiers.weights.tier1;
    } else if (SCORING_CONFIG.tokenTiers.tier2.includes(token)) {
        weight = SCORING_CONFIG.tokenTiers.weights.tier2;
    } else {
        weight = SCORING_CONFIG.tokenTiers.weights.tier3;
    }
    
    // Keep aggressive bag size scaling
    const logBalance = Math.log10(normalizedBalance + 1);
    const bagSizeMultiplier = Math.pow(logBalance, 1.8);
    
    // Minimum threshold for tiny bags
    const minThreshold = 100;
    const thresholdMultiplier = normalizedBalance < minThreshold ? 0.1 : 1;
    
    const points = Math.floor(basePoints * weight * bagSizeMultiplier * thresholdMultiplier);
    
    console.log(`Calculating points for ${token}:`, {
        originalBalance: balance,
        normalizedBalance,
        logBalance: logBalance.toFixed(2),
        basePoints: basePoints.toFixed(2),
        bagSizeMultiplier: bagSizeMultiplier.toFixed(2),
        finalPoints: points
    });
    
    return points;
}

function calculateRetardioScore(
    tokenBalances: TokenBalances,
    nftCount: number
): ScoreResult {
    // Check if user has zero of everything at the start
    const hasZeroOfEverything = Object.values(tokenBalances).every(balance => balance === 0) && nftCount === 0;
    if (hasZeroOfEverything) {
        return {
            points: 0,
            titles: ["Fadoor"],
            breakdowns: [{
                category: "No Holdings",
                points: 0,
                explanation: "Zero tokens and zero NFTs"
            }]
        };
    }

    let totalPoints = 0;
    let titles: string[] = [];
    let breakdowns: ScoreBreakdown[] = [];

    // Calculate NFT multiplier
    const nftTier = SCORING_CONFIG.nftTiers
        .slice()
        .reverse()
        .find(tier => nftCount >= tier.threshold);
    
    // Calculate base points from tokens
    Object.entries(tokenBalances).forEach(([token, balance]) => {
        if (balance > 0) {
            const points = calculateTokenPoints(token, balance);
            totalPoints += points;
            
            let tierLabel = SCORING_CONFIG.tokenTiers.tier1.includes(token) ? 'Base Token' :
                           SCORING_CONFIG.tokenTiers.tier2.includes(token) ? 'Tier 2 Token' :
                           'Tier 3 Token';
            
            breakdowns.push({
                category: token,
                points,
                explanation: `${balance} tokens (${tierLabel})`
            });
        }
    });

    // Apply NFT multiplier if applicable
    if (nftTier) {
        const basePoints = totalPoints;
        totalPoints = Math.floor(totalPoints * nftTier.multiplier);
        titles.push(nftTier.title);
        breakdowns.push({
            category: "NFT Bonus",
            points: totalPoints - basePoints,
            explanation: `${nftTier.multiplier}x multiplier for ${nftCount} Retardio Cousins`
        });
    }

    // Check for special titles
    const nonZeroTokens = Object.entries(tokenBalances)
        .filter(([_, balance]) => balance > 0);
    
    if (nonZeroTokens.length === Object.keys(TOKENS).length) {
        titles.push("Completionist");
    } else if (nonZeroTokens.length === 1) {
        titles.push(`${nonZeroTokens[0][0]} MAXI`);
    }

    // Add achievement badges based on final score
    if (totalPoints >= 400000) {
        titles.push("🐋 Whale");
    } else if (totalPoints >= 50000) {
        titles.push("🐬 Dolphin");
    }

    return {
        points: Math.floor(totalPoints),
        titles,
        breakdowns
    };
}

export default function Home() {
    const [tokenBalances, setTokenBalances] = React.useState<TokenBalances>({});
    const [inputAddress, setInputAddress] = React.useState<string>('');
    const [error, setError] = React.useState<string>('');
    const [isValidAddress, setIsValidAddress] = React.useState<boolean>(false);
    const [nftCount, setNftCount] = React.useState<number>(0);
    const [score, setScore] = React.useState<ScoreResult>({ points: 0, titles: [], breakdowns: [] });
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const connection = new web3.Connection(
        process.env.NEXT_PUBLIC_RPC_URL!,
        {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        }
    );

    const checkAddress = async (address: string) => {
        try {
            const pubKey = new web3.PublicKey(address);
            setIsValidAddress(true);
            setError('');
            return pubKey;
        } catch (err) {
            setIsValidAddress(false);
            setError('Invalid wallet address');
            return null;
        }
    };

    const getBalance = async (address: string) => {
        setIsLoading(true);
        const pubKey = await checkAddress(address);
        if (pubKey) {
            try {
                const balances: TokenBalances = {};
                try {
                    const mintToToken = Object.values(TOKENS).reduce((acc, token) => {
                        acc[token.mint] = token;
                        return acc;
                    }, {} as { [key: string]: TokenConfig });

                    const accounts = await connection.getParsedTokenAccountsByOwner(
                        pubKey,
                        {
                            programId: TOKEN_PROGRAM_ID,
                        }
                    );

                    for (const accountInfo of accounts.value) {
                        try {
                            const parsedInfo = accountInfo.account.data.parsed.info;
                            const tokenMint = parsedInfo.mint;

                            if (mintToToken[tokenMint]) {
                                const amount = parsedInfo.tokenAmount.amount;
                                const decimals = parsedInfo.tokenAmount.decimals;
                                const symbol = Object.keys(TOKENS).find(
                                    key => TOKENS[key].mint === tokenMint
                                );
                                if (symbol) {
                                    balances[symbol] = Number(amount) / Math.pow(10, decimals);
                                }
                            }
                        } catch (parseErr) {
                            console.error('Error parsing account:', parseErr);
                            continue;
                        }
                    }

                    setTokenBalances(balances);

                    let allNFTs: any[] = [];
                    let page = 1;
                    let hasMore = true;

                    while (hasMore) {
                        const nftResponse = await fetch(
                            process.env.NEXT_PUBLIC_RPC_URL!,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    "jsonrpc": "2.0",
                                    "id": "my-id",
                                    "method": "getAssetsByOwner",
                                    "params": {
                                        "ownerAddress": pubKey.toString(),
                                        "page": page,
                                        "limit": 1000
                                    }
                                })
                            }
                        );

                        const nftResult = await nftResponse.json();
                        const pageItems = nftResult.result.items || [];
                        
                        if (pageItems.length === 0) {
                            hasMore = false;
                        } else {
                            allNFTs = [...allNFTs, ...pageItems];
                            page++;
                        }
                    }

                    const cousinsCount = allNFTs.filter(
                        (item: any) => item.grouping?.find(
                            (g: { group_key: string; group_value: string }) => 
                                g.group_key === "collection" && 
                                g.group_value === RETARDIO_COUSINS_ADDRESS
                        )
                    ).length || 0;
                    
                    setNftCount(cousinsCount);

                    // Calculate score after getting all data
                    const scoreResult = calculateRetardioScore(balances, cousinsCount);
                    setScore(scoreResult);

                    setError('');
                } catch (tokenErr) {
                    console.error('Token error:', tokenErr);
                    setTokenBalances({});
                    setNftCount(0);
                    setScore({ points: 0, titles: [], breakdowns: [] });
                }
            } catch (err) {
                console.error('Balance error:', err);
                setError('Error fetching balance');
                setTokenBalances({});
                setNftCount(0);
                setScore({ points: 0, titles: [], breakdowns: [] });
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        getBalance(inputAddress);
    };

    return (
        <main className='min-h-screen bg-black relative overflow-hidden'>
            {/* Repeating background */}
            <div className='fixed inset-0 w-full h-full overflow-hidden pointer-events-none'>
                <div className='absolute inset-0 grid'
                    style={{
                        backgroundImage: 'url("https://www.retardio.xyz/img/0709.webp")',
                        backgroundSize: '320px',
                        opacity: 0.4,
                        maskImage: 'linear-gradient(to bottom, black, black)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black, black)',
                    }}
                />
                <div className='absolute inset-0 bg-black bg-opacity-40'></div>
            </div>

            {/* Main content container */}
            <div className="relative z-10">
                {/* Main content */}
                <div className='container mx-auto min-h-screen flex items-center justify-center px-4'>
                    <div className='window w-full max-w-2xl'>
                        <div className='title-bar'>
                            <div className='title-bar-text flex items-center justify-center'>
                                🤡 Retardio Meter 🤡
                            </div>
                        </div>
                        
                        <div className='window-body bg-[#1a1a1a]'>
                            <form onSubmit={handleSubmit}>
                                <div className='field-row-stacked mb-4'>
                                    <label>Wallet Address</label>
                                    <input 
                                        type="text"
                                        className='w-full bg-white text-black px-2 py-1'
                                        placeholder="Enter wallet address"
                                        value={inputAddress}
                                        onChange={(e) => setInputAddress(e.target.value)}
                                    />
                                    <button type="submit" className='mt-2 w-full'>
                                        Calculate Score
                                    </button>
                                </div>
                            </form>
                            
                            {isLoading ? (
                                <div className='window' style={{marginTop: '1rem'}}>
                                    <div className='window-body'>
                                        <div className='text-center relative animate-pulse'>
                                            <h2 className='text-2xl font-bold mb-2'>
                                                🎰 CALCULATING AUTISM LEVELS 🎲
                                            </h2>
                                            <p className='text-xl'>
                                                🤡 Spinning the wheel of retardation... 🤡
                                            </p>
                                            <p className='text-lg mt-2'>
                                                🎪 Hold tight while we measure your chromosomes 🎪
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : isValidAddress && (
                                <div className='window' style={{marginTop: '1rem'}}>
                                    <div className='window-body'>
                                        <div className='text-center relative'>
                                            {score.points === 0 ? (
                                                <>
                                                    <h2 className='text-2xl font-bold'>
                                                        🤡 ZERO POINTS 🤡
                                                    </h2>
                                                    <p className='mt-2 text-xl'>
                                                        👆😹 NGMI
                                                    </p>
                                                </>
                                            ) : (
                                                <h2 className='text-2xl font-bold'>
                                                    🧩 👻 Retardio Score: {score.points.toLocaleString()} Points🤪 🌟
                                                </h2>
                                            )}
                                        </div>

                                        <fieldset className='mt-4'>
                                            <legend>Titles Earned</legend>
                                            <div className='flex flex-wrap gap-2 items-center justify-between'>
                                                <div className='flex flex-wrap gap-2'>
                                                    {score.titles.map(title => (
                                                        <span 
                                                            key={title}
                                                            className={`
                                                                badge px-3 py-1 rounded-full text-sm font-bold shadow-lg 
                                                                transition-all duration-300 hover:scale-105 
                                                                ${
                                                                    title === 'Fadoor' ? 'bg-gradient-to-r from-gray-500 to-red-500 text-white border border-red-300' :
                                                                    title === 'RETARDIO MAXI' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border border-pink-300' :
                                                                    title === 'XD MAXI' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border border-pink-300' :
                                                                    title === 'GLORP MAXI' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border border-green-300' :
                                                                    title === 'AUTISM MAXI' ? 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-white border border-yellow-300' :
                                                                    title === 'MLG MAXI' ? 'bg-gradient-to-r from-blue-600 via-red-500 to-white text-white border border-blue-300' :
                                                                    title === 'RAPR MAXI' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-blue-300' :
                                                                    title === 'YAKUB MAXI' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white border border-yellow-300' :
                                                                    title === 'FLOYDAI MAXI' ? 'bg-gradient-to-r from-gray-900 to-red-900 text-white border border-red-300' :
                                                                    title === 'UWU MAXI' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white border border-purple-300' :
                                                                    title === 'BPD MAXI' ? 'bg-gradient-to-r from-gray-600 to-slate-700 text-white border border-gray-300' :
                                                                    title.includes('Whale') ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white border border-blue-300' :
                                                                    title.includes('Dolphin') ? 'bg-gradient-to-r from-cyan-400 to-teal-500 text-white border border-cyan-300' :
                                                                    'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 border border-gray-400'
                                                                }
                                                                hover:shadow-xl cursor-help
                                                            `}
                                                            title={
                                                                title === 'Fadoor' ? 'Midcurve fading retardio' :
                                                                title === 'RETARDIO MAXI' ? '💎 True believer - Only holds RETARDIO tokens' :
                                                                title === 'XD MAXI' ? '💎 True believer - Only holds XD tokens' :
                                                                title === 'GLORP MAXI' ? '💎 True believer - Only holds GLORP tokens' :
                                                                title === 'AUTISM MAXI' ? '💎 True believer - Only holds AUTISM tokens' :
                                                                title === 'MLG MAXI' ? '💎 True believer - Only holds MLG tokens' :
                                                                title === 'RAPR MAXI' ? '💎 True believer - Only holds RAPR tokens' :
                                                                title === 'YAKUB MAXI' ? '💎 True believer - Only holds YAKUB tokens' :
                                                                title === 'FLOYDAI MAXI' ? '💎 True believer - Only holds FLOYDAI tokens' :
                                                                title === 'UWU MAXI' ? '💎 True believer - Only holds UWU tokens' :
                                                                title === 'BPD MAXI' ? '💎 True believer - Only holds BPD tokens' :
                                                                title.includes('Whale') ? '🐋 WHALE - 500k+ points. Retar Dio.' :
                                                                title.includes('Dolphin') ? '🐬 DOLPHIN - 50k-500k points. Study autism.' :
                                                                title.includes('Supreme Autist') ? '🧩 SUPREME AUTIST - 50+ Retardio Cousins. Maximum autism achieved.' :
                                                                title.includes('Mitch Fanboy') ? '🔮 Mitch Fanboy - 10+ Retardio Cousins. Main Character enjoyer' :
                                                                title.includes('Based Department') ? '📞 BASED DEPARTMENT - 5+ Retardio Cousins. They\'re calling, it\'s for you anon.' :
                                                                title.includes('Schizo') ? '👁️ SCHIZO APPRENTICE - First Retardio Cousin acquired. The voices were right about this one.' :
                                                                'Unknown Title'
                                                            }
                                                        >
                                                            {title}
                                                        </span>
                                                    ))}
                                                </div>
                                                <a 
                                                    href="https://x.com/Onchainmetrics" 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center"
                                                >
                                                    <div className="w-7 h-7">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-full h-full">
                                                            <path fill="white" d="M13.6 3.5h6.3l-5.8 6.8L21 19.5h-6.4l-4.1-5.5-4.7 5.5H2.5l6.2-7.3L2.5 3.5h6.5l3.7 5 3.9-5zm-1.4 14.1h1.9L6.5 5.5H4.4l7.8 12.1z"/>
                                                        </svg>
                                                    </div>
                                                </a>
                                            </div>
                                        </fieldset>

                                        <fieldset className='mt-4'>
                                            <legend>Score Breakdown</legend>
                                            <div className='score-list'>
                                                {score.breakdowns
                                                    .sort((a, b) => b.points - a.points)
                                                    .map((breakdown, index) => (
                                                        <div key={index} className='field-row justify-between'>
                                                            <span>{breakdown.category}</span>
                                                            <div className='flex items-center gap-4'>
                                                                <span className='text-sm text-gray-400'>
                                                                    {breakdown.explanation.includes('multiplier') 
                                                                        ? breakdown.explanation.split(' ').find(word => word.includes('x'))  // For NFT multiplier
                                                                        : breakdown.explanation.includes('Token')
                                                                            ? `${breakdown.explanation.split('(')[1].replace(')', '')}` // For token tiers
                                                                            : ''
                                                                    }
                                                                </span>
                                                                <span>{breakdown.points.toLocaleString()} points</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </fieldset>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}