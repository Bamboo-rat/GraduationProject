// locationService.ts
import axios from '~/config/axios';

const locationService = {
  async getProvinces() {
    const res = await axios.get('/locations/provinces');
    return res.data?.data || [];
  },
  async getDistricts(provinceCode: number) {
    const res = await axios.get(`/locations/districts/${provinceCode}`);
    return res.data?.data || [];
  },
  async getWards(districtCode: number) {
    const res = await axios.get(`/locations/wards/${districtCode}`);
    return res.data?.data || [];
  },
};

export default locationService;
