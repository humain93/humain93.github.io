import heroRoboticsLabImg from '../assets/images/hero_robotics_laboratory_1794031870892.jpg';
import projectNonlinearMpcImg from '../assets/images/project_nonlinear_mpc_actuator_1794031873592.jpg';
import projectPinnDynamicsImg from '../assets/images/project_pinn_dynamical_systems_1794031875510.jpg';
import projectAutonomousUgvImg from '../assets/images/project_autonomous_perception_ugv_1794031875170.jpg';
import sindyRlCartpoleImg from '../assets/images/sindy_rl_cartpole_architecture_1794056013583.jpg';
import siEngineHeatTransferImg from '../assets/images/si_engine_heat_transfer_simulation_1794056015969.jpg';
import smartGridDigitalTwinImg from '../assets/images/smart_grid_digital_twin_gis_1794056017469.jpg';
import predictiveMaintenanceImg from '../assets/images/predictive_maintenance_sensors_1794056017073.jpg';

export const GENERATED_ASSET_URLS: Record<string, string> = {
  '/src/assets/images/hero_robotics_laboratory_1794031870892.jpg': heroRoboticsLabImg,
  '/src/assets/images/project_nonlinear_mpc_actuator_1794031873592.jpg': projectNonlinearMpcImg,
  '/src/assets/images/project_pinn_dynamical_systems_1794031875510.jpg': projectPinnDynamicsImg,
  '/src/assets/images/project_autonomous_perception_ugv_1794031875170.jpg': projectAutonomousUgvImg,
  '/src/assets/images/sindy_rl_cartpole_architecture_1794056013583.jpg': sindyRlCartpoleImg,
  '/src/assets/images/si_engine_heat_transfer_simulation_1794056015969.jpg': siEngineHeatTransferImg,
  '/src/assets/images/smart_grid_digital_twin_gis_1794056017469.jpg': smartGridDigitalTwinImg,
  '/src/assets/images/predictive_maintenance_sensors_1794056017073.jpg': predictiveMaintenanceImg,
};

export function resolveAssetUrl(url: string | undefined): string {
  if (!url) return '';
  if (GENERATED_ASSET_URLS[url]) {
    return GENERATED_ASSET_URLS[url];
  }
  return url;
}
