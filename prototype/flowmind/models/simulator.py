# models/simulator.py
import pandas as pd


class SimulationModels:
    """封装用于决策评估与未来模拟的模型"""

    def __init__(self, historical_data_df: pd.DataFrame, gnn_predictor_func):
        self.data = historical_data_df
        self.gnn_predictor = gnn_predictor_func

    def get_history(self, code_a: int, code_b: int) -> pd.DataFrame:
        """获取两个城市间的历史数据"""
        return self.data[
            (self.data['code_a'] == code_a) &
            (self.data['code_b'] == code_b)
            ][['year', 'value']].sort_values('year')

    def causal_simulator(self, code_a: int, code_b: int, policy_year: int) -> float or None:
        """反事实模拟器：基于合成控制法(SCM)思想"""
        # Step 1: Define treatment and pre-treatment period
        pre_policy_data = self.data[
            (self.data['code_a'] == code_a) & (self.data['code_b'] == code_b) & (self.data['year'] < policy_year)]
        if len(pre_policy_data) < 2: return None

        # Step 2: Simplified weight calculation (using historical trend)
        last_real_value = pre_policy_data.sort_values('year').iloc[-1]['value']
        first_real_value = pre_policy_data.iloc[0]['value']
        if first_real_value == 0: return last_real_value * 1.01

        # Step 3: Construct synthetic control's counterfactual path
        historical_growth = (last_real_value / first_real_value) ** (1 / len(pre_policy_data)) - 1
        counterfactual_value = last_real_value * (1 + max(0, historical_growth * 0.5))
        return round(counterfactual_value, 5)

    def scenario_simulator(self, code_a: int, code_b: int, future_year: int, policy_strength: str) -> tuple:
        """未来情景模拟器"""
        # Step 1: Predict baseline future using the best available model
        baseline_prediction = self.gnn_predictor(code_a, code_b, future_year)

        # Step 2: Define policy impact factors
        if policy_strength == '弱':
            factor = 1.05
        elif policy_strength == '中':
            factor = 1.15
        else:
            factor = 1.30

        # Step 3: Calculate the simulated future value
        simulated_value = baseline_prediction * factor
        return round(baseline_prediction, 5), round(simulated_value, 5)