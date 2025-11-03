import axiosInstance from '../config/axios';

export interface SystemConfigResponse {
  configKey: string;
  configValue: string;
  description: string;
  valueType: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateSystemConfigRequest {
  configKey: string;
  configValue: string;
  description?: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

class SystemConfigService {
  private readonly BASE_URL = '/system-config';

  /**
   * Get all system configs (SUPER_ADMIN only)
   */
  async getAllConfigs(): Promise<SystemConfigResponse[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<SystemConfigResponse[]>>(this.BASE_URL);
      return data.data;
    } catch (error) {
      console.error('Error fetching system configs:', error);
      throw error;
    }
  }

  /**
   * Get public configs (no auth required)
   */
  async getPublicConfigs(): Promise<SystemConfigResponse[]> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<SystemConfigResponse[]>>(`${this.BASE_URL}/public`);
      return data.data;
    } catch (error) {
      console.error('Error fetching public configs:', error);
      throw error;
    }
  }

  /**
   * Get config value by key
   */
  async getConfigByKey(key: string): Promise<string> {
    try {
      const { data } = await axiosInstance.get<ApiResponse<string>>(`${this.BASE_URL}/${key}`);
      return data.data;
    } catch (error) {
      console.error(`Error fetching config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Update config value
   */
  async updateConfig(key: string, request: UpdateSystemConfigRequest): Promise<SystemConfigResponse> {
    try {
      const { data } = await axiosInstance.put<ApiResponse<SystemConfigResponse>>(
        `${this.BASE_URL}/${key}`,
        request
      );
      return data.data;
    } catch (error) {
      console.error(`Error updating config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Create or update config
   */
  async createOrUpdateConfig(
    request: UpdateSystemConfigRequest,
    valueType?: string,
    isPublic: boolean = false
  ): Promise<SystemConfigResponse> {
    try {
      const params = new URLSearchParams();
      if (valueType) params.append('valueType', valueType);
      params.append('isPublic', isPublic.toString());

      const { data } = await axiosInstance.post<ApiResponse<SystemConfigResponse>>(
        `${this.BASE_URL}?${params.toString()}`,
        request
      );
      return data.data;
    } catch (error) {
      console.error('Error creating/updating config:', error);
      throw error;
    }
  }

  /**
   * Delete config
   */
  async deleteConfig(key: string): Promise<void> {
    try {
      await axiosInstance.delete(`${this.BASE_URL}/${key}`);
    } catch (error) {
      console.error(`Error deleting config ${key}:`, error);
      throw error;
    }
  }
}

export const systemConfigService = new SystemConfigService();
export default systemConfigService;
