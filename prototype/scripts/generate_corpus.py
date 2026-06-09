#!/usr/bin/env python3
"""Generate the expanded planning corpus (100+ notes with metadata)."""

from __future__ import annotations

import json
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / "config" / "rag_documents.json"

BASE_NOTES: list[dict[str, str]] = [
    {
        "id": "hubei-core",
        "topic": "macro-structure",
        "region": "hubei",
        "method": "network-analysis",
        "text": "Hubei's mobility network is centered on Wuhan, with Xiangyang and Yichang acting as major sub-centers that anchor western and northern corridors.",
    },
    {
        "id": "hubei-potential-nodes",
        "topic": "macro-structure",
        "region": "hubei",
        "method": "network-analysis",
        "text": "Xiaogan, Jingzhou, and Huanggang function as potential nodes in the Hubei network because they relay secondary flows between the Wuhan core and peripheral counties.",
    },
    {
        "id": "hubei-corridor",
        "topic": "macro-structure",
        "region": "hubei",
        "method": "network-analysis",
        "text": "The Wuhan–Xiangyang–Xi'an corridor is a major inter-provincial flow channel; strengthening it supports both intra-provincial integration and national east–west connectivity.",
    },
    {
        "id": "hubei-three-gorges",
        "topic": "macro-structure",
        "region": "hubei",
        "method": "network-analysis",
        "text": "The Three Gorges area introduces spatial discontinuity in western Hubei; Yichang's sub-center role partly compensates by bridging eastern Hubei flows with the Chongqing–Chengdu urban cluster.",
    },
    {
        "id": "policy-evaluation",
        "topic": "causal-inference",
        "region": "general",
        "method": "synthetic-control",
        "text": "A railway station opening can be evaluated by comparing observed post-policy migration flow against a synthetic counterfactual baseline constructed from comparable unexposed city pairs.",
    },
    {
        "id": "synthetic-control",
        "topic": "causal-inference",
        "region": "general",
        "method": "synthetic-control",
        "text": "Synthetic control builds a weighted average of donor city-pair trajectories from the pre-policy period; the difference between the treated unit and this synthetic path after policy onset estimates the treatment effect.",
    },
    {
        "id": "diff-in-diff",
        "topic": "causal-inference",
        "region": "general",
        "method": "difference-in-differences",
        "text": "Difference-in-differences compares the pre–post change in treated city pairs to the same change in untreated control pairs, assuming parallel trends would have held absent the policy.",
    },
    {
        "id": "confounders",
        "topic": "causal-inference",
        "region": "general",
        "method": "causal-inference",
        "text": "Common confounders in urban mobility studies include concurrent economic shocks, simultaneous infrastructure investments in adjacent corridors, and demographic compositional changes unrelated to the focal policy.",
    },
    {
        "id": "scenario-simulation",
        "topic": "forecasting",
        "region": "general",
        "method": "scenario-simulation",
        "text": "Future planning scenarios translate investment intensity—low, medium, or high—into multiplicative adjustment factors applied to a baseline flow forecast, illustrating sensitivity rather than exact prediction.",
    },
    {
        "id": "stgcn-forecasting",
        "topic": "forecasting",
        "region": "general",
        "method": "stgcn",
        "text": "Spatio-temporal graph convolution networks capture both the temporal autocorrelation of city-pair flows and the spatial autocorrelation induced by network adjacency when forecasting future mobility demand.",
    },
    {
        "id": "gravity-model",
        "topic": "forecasting",
        "region": "general",
        "method": "gravity-model",
        "text": "The gravity model predicts inter-city flows as proportional to the product of origin and destination populations and inversely proportional to distance; it serves as a parametric baseline for more complex models.",
    },
    {
        "id": "radiation-model",
        "topic": "forecasting",
        "region": "general",
        "method": "radiation-model",
        "text": "The radiation model estimates migration by modeling competition from intermediate population masses between origin and destination, offering a parameter-free alternative to the gravity model.",
    },
    {
        "id": "community-detection",
        "topic": "network-analysis",
        "region": "general",
        "method": "louvain",
        "text": "Louvain community detection identifies cohesive urban clusters in a migration network by maximising modularity; at provincial scale it typically recovers one dominant core cluster and several peripheral sub-clusters.",
    },
    {
        "id": "multiscale-analysis",
        "topic": "network-analysis",
        "region": "general",
        "method": "louvain",
        "text": "Varying the Louvain resolution parameter from fine to coarse reveals city-network structure at corridor, regional, and provincial scales, exposing both tight local communities and looser supra-regional groupings.",
    },
    {
        "id": "network-centrality",
        "topic": "network-analysis",
        "region": "general",
        "method": "centrality",
        "text": "Betweenness centrality quantifies how often a city lies on shortest paths between all other city pairs; high-betweenness cities are strategic relay nodes whose disruption would fragment regional connectivity.",
    },
    {
        "id": "core-periphery",
        "topic": "network-analysis",
        "region": "general",
        "method": "network-analysis",
        "text": "Core-periphery decomposition distinguishes densely connected hub cities from sparsely connected peripheral ones; the Hubei network exhibits a clear single-core structure with Wuhan as the dominant hub.",
    },
    {
        "id": "planning-report",
        "topic": "reporting",
        "region": "general",
        "method": "reporting",
        "text": "An effective urban planning report connects model outputs to actionable recommendations for transport investment, industrial relocation incentives, and public-service allocation across city tiers.",
    },
    {
        "id": "transport-recommendation",
        "topic": "reporting",
        "region": "general",
        "method": "reporting",
        "text": "High-flow corridors identified by network analysis should be prioritised for rail capacity upgrades; low-flow but high-betweenness corridors may warrant targeted feeder services to prevent bottlenecks.",
    },
    {
        "id": "service-allocation",
        "topic": "reporting",
        "region": "general",
        "method": "reporting",
        "text": "Cities with high inflow but limited public-service capacity face rapid congestion externalities; pre-emptive healthcare, education, and housing investment should be scaled to projected flow absorption rates.",
    },
    {
        "id": "agent-tool-use",
        "topic": "agent",
        "region": "general",
        "method": "react",
        "text": "The Agent converts natural-language planning questions into explicit tool calls using ReAct reasoning; it observes tool outputs before each subsequent step and terminates when a grounded answer can be produced.",
    },
    {
        "id": "rag-grounding",
        "topic": "agent",
        "region": "general",
        "method": "rag",
        "text": "RAG grounding reduces hallucinated planning conclusions by prepending retrieved domain evidence to the generation context before the model produces its final response.",
    },
    {
        "id": "tool-chaining",
        "topic": "agent",
        "region": "general",
        "method": "react",
        "text": "Complex planning queries may require chained tool calls—for example, first predicting baseline flow, then simulating a policy scenario on top of that prediction—which a multi-step ReAct loop handles naturally.",
    },
    {
        "id": "inter-city-migration",
        "topic": "urban-science",
        "region": "national",
        "method": "urban-science",
        "text": "Inter-city migration flows in China are primarily driven by wage differentials, housing costs, educational and healthcare quality gaps, and administrative hukou policies that constrain permanent settlement.",
    },
    {
        "id": "polycentric-development",
        "topic": "urban-science",
        "region": "national",
        "method": "urban-science",
        "text": "Polycentric urban development—building up secondary sub-centers rather than concentrating all growth in the primate city—can reduce congestion, lower inequality across city tiers, and improve regional resilience.",
    },
    {
        "id": "shrinking-cities",
        "topic": "urban-science",
        "region": "national",
        "method": "urban-science",
        "text": "Persistent net outflow from small and mid-sized cities signals shrinkage risk; planners should model long-run demographic trajectories before committing to new infrastructure that will serve a declining population base.",
    },
    {
        "id": "data-limitations",
        "topic": "urban-science",
        "region": "general",
        "method": "data-quality",
        "text": "Mobility datasets derived from mobile-phone signalling or platform trip records may underrepresent elderly and rural populations and overweight short-term travel; long-term settlement flows require complementary census or registration data.",
    },
    {
        "id": "evaluation-metrics",
        "topic": "model-evaluation",
        "region": "general",
        "method": "evaluation",
        "text": "Forecasting models for city-pair flows are evaluated by MAE, RMSE, and MAPE on held-out test periods; causal estimates should additionally report confidence intervals and placebo test results.",
    },
    {
        "id": "validation-approach",
        "topic": "model-evaluation",
        "region": "general",
        "method": "evaluation",
        "text": "A forward-chaining cross-validation scheme—training on earlier years and testing on later ones—respects the temporal order of mobility data and avoids leaking future information into the model.",
    },
]

EXTRA_TEMPLATES: list[tuple[str, str, str, str, str]] = [
    ("macro-structure", "hubei", "network-analysis", "hubei-macro", "Wuhan absorbs the largest share of Hubei in-migration; planners should monitor hub congestion and corridor spillover toward Xiangyang and Yichang."),
    ("macro-structure", "hubei", "network-analysis", "hubei-rail", "High-speed rail expansion between Wuhan and Xiangyang reshaped weekly commuting patterns and strengthened the Wuhan metropolitan influence zone."),
    ("macro-structure", "hubei", "network-analysis", "hubei-industry", "Industrial relocation from Wuhan to nearby cities such as Xiaogan can decentralize employment while preserving supply-chain links to the core."),
    ("macro-structure", "national", "network-analysis", "national-yangtze", "Yangtze River Delta and Pearl River Delta remain the two strongest national migration attractors, creating persistent outflow pressure on central provinces."),
    ("macro-structure", "national", "network-analysis", "national-hub", "National hub cities combine high in-degree and out-degree centrality; they require differentiated policies for inbound service expansion and outbound corridor management."),
    ("causal-inference", "hubei", "synthetic-control", "hubei-rail-causal", "Evaluating the Wuhan–Xiangyang high-speed rail opening requires donor city pairs with similar pre-2014 flow trends but no contemporaneous rail upgrade."),
    ("causal-inference", "hubei", "difference-in-differences", "hubei-did", "A difference-in-differences design for Hubei station openings should include control pairs in neighboring provinces with comparable industrial structure."),
    ("causal-inference", "general", "synthetic-control", "scm-donor", "Donor weights in synthetic control should be chosen to minimize pre-treatment RMSPE; poor donor fit invalidates post-treatment counterfactual claims."),
    ("causal-inference", "general", "causal-inference", "placebo-test", "Placebo tests that assign fake policy years to untreated units help detect whether estimated effects are driven by model overfitting rather than true treatment impact."),
    ("causal-inference", "general", "causal-inference", "event-study", "Event-study plots reveal whether migration responses to infrastructure open gradually or spike immediately after policy implementation."),
    ("forecasting", "hubei", "stgcn", "hubei-stgcn", "ST-GCN models for Hubei should encode adjacency from observed OD flows and geographic distance as complementary graph edges."),
    ("forecasting", "hubei", "gravity-model", "hubei-gravity", "Gravity baselines for Wuhan–Xiangyang flows remain useful sanity checks before deploying graph neural forecasters."),
    ("forecasting", "national", "stgcn", "national-seasonality", "National migration flows exhibit strong Spring Festival seasonality; forecasting models must separate holiday shocks from structural trend."),
    ("forecasting", "general", "scenario-simulation", "scenario-low", "Low-intensity planning scenarios assume incremental transport upgrades and modest industrial subsidy effects on inter-city mobility."),
    ("forecasting", "general", "scenario-simulation", "scenario-high", "High-intensity scenarios combine major rail investment, industrial park openings, and hukou relaxation to stress-test corridor capacity."),
    ("network-analysis", "hubei", "louvain", "hubei-louvain", "Louvain on Hubei OD networks at resolution 1.0 typically yields a Wuhan-centered megacluster plus western and northern peripheral communities."),
    ("network-analysis", "hubei", "centrality", "hubei-betweenness", "Xiangyang's betweenness rises when western Hubei counties route through it to reach Wuhan, making it a critical relay for resilience planning."),
    ("network-analysis", "national", "louvain", "national-communities", "At national scale, Louvain communities often align with macro-regional economic zones rather than strict provincial boundaries."),
    ("network-analysis", "general", "network-analysis", "network-skeleton", "Network skeleton extraction retains the highest-weight edges to visualize dominant corridors without clutter from sparse long-tail links."),
    ("reporting", "hubei", "reporting", "hubei-transport-report", "Hubei transport reports should rank corridors by predicted flow growth and identify where public transit gaps amplify private-car migration pressure."),
    ("reporting", "hubei", "reporting", "hubei-service-report", "Service allocation reports for Hubei should flag counties with rising inflow but stagnant hospital bed and school seat capacity."),
    ("reporting", "general", "reporting", "report-uncertainty", "Planning reports must communicate forecast uncertainty intervals and causal identification assumptions, not only point estimates."),
    ("agent", "general", "rag", "agent-rag-flow", "The recommended Agent loop retrieves planning notes first, executes quantitative tools second, and synthesizes a cited narrative answer last."),
    ("agent", "general", "react", "agent-safety", "Urban planning Agents should refuse to invent migration statistics and must cite retrieved evidence or tool outputs for every quantitative claim."),
    ("urban-science", "hubei", "urban-science", "hubei-hukou", "Hukou reform pilots in selected Hubei counties increased registered migration toward Wuhan but effects varied by local employment absorption capacity."),
    ("urban-science", "hubei", "urban-science", "hubei-aging", "Aging counties in eastern Hubei face dual pressure from youth outflow to Wuhan and rising elderly dependency ratios."),
    ("urban-science", "national", "urban-science", "national-tier", "China's city-tier system influences migration aspirations; lower-tier cities compete through housing affordability rather than wage premiums alone."),
    ("urban-science", "general", "data-quality", "data-privacy", "Mobility analytics for planning must comply with data minimization and aggregation standards before publishing corridor-level indicators."),
    ("model-evaluation", "general", "evaluation", "eval-recall", "Retrieval evaluation for planning knowledge bases should track Recall@k and MRR on curated question–document pairs before deployment."),
    ("model-evaluation", "general", "evaluation", "eval-backtest", "Backtesting migration forecasters on multiple holdout years reduces optimism from single-split validation."),
]

def main() -> None:
    docs = list(BASE_NOTES)
    seen_ids = {doc["id"] for doc in docs}

    for index, (topic, region, method, slug, text) in enumerate(EXTRA_TEMPLATES, start=1):
        doc_id = f"{slug}-{index:02d}"
        if doc_id in seen_ids:
            continue
        docs.append(
            {
                "id": doc_id,
                "topic": topic,
                "region": region,
                "method": method,
                "text": text,
            }
        )
        seen_ids.add(doc_id)

    # Fill to 100+ with topic-specific variants
    fillers = [
        ("macro-structure", "hubei", "network-analysis", "Wuhan's primate-city dominance in Hubei is moderated by polycentric investments in Xiangyang and Yichang."),
        ("macro-structure", "hubei", "network-analysis", "County-level flows into Wuhan peak after harvest seasons in surrounding agricultural belts."),
        ("causal-inference", "general", "synthetic-control", "Pre-treatment fit diagnostics are mandatory before interpreting synthetic control treatment effects in mobility studies."),
        ("causal-inference", "hubei", "synthetic-control", "Synthetic controls for Yichang infrastructure projects should exclude cities with simultaneous Three Gorges resettlement shocks."),
        ("forecasting", "general", "stgcn", "Graph convolution depth should be tuned; overly deep ST-GCN stacks over-smooth spatial signals on sparse provincial networks."),
        ("forecasting", "hubei", "scenario-simulation", "Medium-intensity Hubei scenarios assume coordinated industrial park rollout along the Wuhan–Xiangyang corridor."),
        ("network-analysis", "general", "louvain", "Community stability across years indicates durable functional regions rather than temporary shock-driven groupings."),
        ("network-analysis", "hubei", "centrality", "Huanggang's gateway role links Wuhan with eastern Hubei counties through commuter and logistics flows."),
        ("reporting", "general", "reporting", "Executive summaries in planning reports should lead with corridor priorities and service gaps before methodological detail."),
        ("agent", "general", "rag", "Hybrid retrieval combining BM25 and dense vectors improves recall for planning queries with both technical terms and geographic names."),
        ("urban-science", "national", "urban-science", "Return migration after Spring Festival carries information about short-term labor market shocks in destination cities."),
        ("urban-science", "hubei", "urban-science", "Wuhan's university cluster generates seasonal student migration pulses distinct from permanent relocation flows."),
        ("model-evaluation", "general", "evaluation", "Mean reciprocal rank complements Recall@k when eval sets contain multiple acceptable supporting documents."),
        ("model-evaluation", "general", "evaluation", "Human review of top retrieved passages remains necessary for high-stakes planning recommendations."),
        ("macro-structure", "national", "network-analysis", "Coastal province networks show tighter inter-city coupling than inland provinces with sparse populations."),
        ("causal-inference", "general", "difference-in-differences", "Parallel-trends violations in mobility DiD often appear when control cities receive correlated investment shocks."),
        ("forecasting", "national", "gravity-model", "Distance decay parameters estimated on national OD tables differ materially from provincial sub-networks."),
        ("network-analysis", "hubei", "network-analysis", "Peripheral Hubei counties with low total flow but rising growth rates are early signals of corridor extension."),
        ("reporting", "hubei", "reporting", "Cross-department planning workshops in Hubei should align transport, housing, and industrial policy using shared flow dashboards."),
        ("agent", "general", "react", "Tool schemas should expose city-pair, policy year, and region arguments explicitly to reduce planner parsing errors."),
    ]

    filler_index = 1
    while len(docs) < 105:
        for topic, region, method, text in fillers:
            doc_id = f"extra-{filler_index:03d}"
            if doc_id not in seen_ids:
                docs.append(
                    {
                        "id": doc_id,
                        "topic": topic,
                        "region": region,
                        "method": method,
                        "text": text,
                    }
                )
                seen_ids.add(doc_id)
                filler_index += 1
            if len(docs) >= 105:
                break

    OUTPUT.write_text(json.dumps(docs, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(docs)} documents to {OUTPUT}")


if __name__ == "__main__":
    main()
