// import { useState } from 'react';

// const CreateProduct = () => {
//   const [formData, setFormData] = useState({
//     product: { name: '', description: '', categoryId: '' },
//     attributes: [],
//     variants: [],
//     images: [],
//     storeInventory: []
//   });

//   const [currentStep, setCurrentStep] = useState(1);

//   // Step 1: Basic Product Info
//   const ProductInfoForm = () => (
//     <div>
//       <input 
//         placeholder="Tên sản phẩm"
//         value={formData.product.name}
//         onChange={(e) => setFormData({
//           ...formData,
//           product: { ...formData.product, name: e.target.value }
//         })}
//       />
//       <textarea 
//         placeholder="Mô tả"
//         value={formData.product.description}
//         onChange={(e) => setFormData({
//           ...formData,
//           product: { ...formData.product, description: e.target.value }
//         })}
//       />
//       <select 
//         value={formData.product.categoryId}
//         onChange={(e) => setFormData({
//           ...formData,
//           product: { ...formData.product, categoryId: e.target.value }
//         })}
//       >
//         <option value="">Chọn danh mục</option>
//         {/* Load categories from API */}
//       </select>
//     </div>
//   );

//   // Step 2: Attributes
//   const AttributesForm = () => {
//     const addAttribute = () => {
//       setFormData({
//         ...formData,
//         attributes: [...formData.attributes, { attributeName: '', attributeValue: '' }]
//       });
//     };

//     const updateAttribute = (index, field, value) => {
//       const newAttributes = [...formData.attributes];
//       newAttributes[index][field] = value;
//       setFormData({ ...formData, attributes: newAttributes });
//     };

//     return (
//       <div>
//         <h3>Thuộc tính sản phẩm</h3>
//         {formData.attributes.map((attr, index) => (
//           <div key={index}>
//             <input 
//               placeholder="Tên thuộc tính (vd: Thương hiệu)"
//               value={attr.attributeName}
//               onChange={(e) => updateAttribute(index, 'attributeName', e.target.value)}
//             />
//             <input 
//               placeholder="Giá trị (vd: Vinamilk)"
//               value={attr.attributeValue}
//               onChange={(e) => updateAttribute(index, 'attributeValue', e.target.value)}
//             />
//           </div>
//         ))}
//         <button onClick={addAttribute}>+ Thêm thuộc tính</button>
//       </div>
//     );
//   };

//   // Step 3: Variants
//   const VariantsForm = () => {
//     const addVariant = () => {
//       setFormData({
//         ...formData,
//         variants: [...formData.variants, {
//           name: '',
//           sku: '',
//           originalPrice: 0,
//           discountPrice: 0,
//           expiryDate: ''
//         }]
//       });
//     };

//     return (
//       <div>
//         <h3>Biến thể sản phẩm</h3>
//         {formData.variants.map((variant, index) => (
//           <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
//             <input 
//               placeholder="Tên biến thể (vd: Vị Dâu 100ml)"
//               value={variant.name}
//               onChange={(e) => {
//                 const newVariants = [...formData.variants];
//                 newVariants[index].name = e.target.value;
//                 setFormData({ ...formData, variants: newVariants });
//               }}
//             />
//             <input 
//               placeholder="SKU (vd: VNM-SCH-DAU-100)"
//               value={variant.sku}
//               onChange={(e) => {
//                 const newVariants = [...formData.variants];
//                 newVariants[index].sku = e.target.value;
//                 setFormData({ ...formData, variants: newVariants });
//               }}
//             />
//             <input 
//               type="number"
//               placeholder="Giá gốc"
//               value={variant.originalPrice}
//               onChange={(e) => {
//                 const newVariants = [...formData.variants];
//                 newVariants[index].originalPrice = parseFloat(e.target.value);
//                 setFormData({ ...formData, variants: newVariants });
//               }}
//             />
//             <input 
//               type="date"
//               placeholder="Hạn sử dụng"
//               value={variant.expiryDate}
//               onChange={(e) => {
//                 const newVariants = [...formData.variants];
//                 newVariants[index].expiryDate = e.target.value;
//                 setFormData({ ...formData, variants: newVariants });
//               }}
//             />
//           </div>
//         ))}
//         <button onClick={addVariant}>+ Thêm biến thể</button>
//       </div>
//     );
//   };

//   // Step 4: Images
//   const ImagesForm = () => {
//     const handleUpload = async (file) => {
//       const formData = new FormData();
//       formData.append('file', file);
      
//       const response = await fetch('/api/files/upload/product', {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}` },
//         body: formData
//       });
      
//       const result = await response.json();
      
//       setFormData(prev => ({
//         ...prev,
//         images: [...prev.images, {
//           imageUrl: result.data.url,
//           isPrimary: prev.images.length === 0,
//           displayOrder: prev.images.length + 1
//         }]
//       }));
//     };

//     return (
//       <div>
//         <h3>Hình ảnh sản phẩm</h3>
//         <input 
//           type="file" 
//           multiple 
//           accept="image/*"
//           onChange={(e) => {
//             Array.from(e.target.files).forEach(handleUpload);
//           }}
//         />
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
//           {formData.images.map((img, index) => (
//             <div key={index}>
//               <img src={img.imageUrl} alt="" style={{ width: '100%' }} />
//               <label>
//                 <input 
//                   type="checkbox" 
//                   checked={img.isPrimary}
//                   onChange={(e) => {
//                     const newImages = formData.images.map((i, idx) => ({
//                       ...i,
//                       isPrimary: idx === index
//                     }));
//                     setFormData({ ...formData, images: newImages });
//                   }}
//                 />
//                 Ảnh chính
//               </label>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Step 5: Store Inventory
//   const InventoryForm = () => (
//     <div>
//       <h3>Tồn kho tại cửa hàng</h3>
//       {/* For each variant, allow setting quantity per store */}
//       {formData.variants.map((variant, vIndex) => (
//         <div key={vIndex}>
//           <h4>{variant.name} ({variant.sku})</h4>
//           {/* List of supplier's stores */}
//           {stores.map((store, sIndex) => (
//             <div key={sIndex}>
//               <label>{store.storeName}</label>
//               <input 
//                 type="number"
//                 placeholder="Số lượng"
//                 onChange={(e) => {
//                   // Add to storeInventory array
//                   const newInventory = [...formData.storeInventory];
//                   const existingIndex = newInventory.findIndex(
//                     inv => inv.storeId === store.storeId && inv.variantSku === variant.sku
//                   );
                  
//                   if (existingIndex >= 0) {
//                     newInventory[existingIndex].stockQuantity = parseInt(e.target.value);
//                   } else {
//                     newInventory.push({
//                       storeId: store.storeId,
//                       variantSku: variant.sku,
//                       stockQuantity: parseInt(e.target.value),
//                       priceOverride: null
//                     });
//                   }
                  
//                   setFormData({ ...formData, storeInventory: newInventory });
//                 }}
//               />
//             </div>
//           ))}
//         </div>
//       ))}
//     </div>
//   );

//   const handleSubmit = async () => {
//     try {
//       const response = await fetch('/api/products', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(formData)
//       });

//       if (response.ok) {
//         alert('Tạo sản phẩm thành công! Đang chờ admin phê duyệt.');
//         // Redirect to product list
//       }
//     } catch (error) {
//       console.error('Error creating product:', error);
//     }
//   };

//   return (
//     <div>
//       <h2>Tạo sản phẩm mới</h2>
      
//       {/* Wizard Steps */}
//       <div className="wizard-steps">
//         <div className={currentStep >= 1 ? 'active' : ''}>1. Thông tin cơ bản</div>
//         <div className={currentStep >= 2 ? 'active' : ''}>2. Thuộc tính</div>
//         <div className={currentStep >= 3 ? 'active' : ''}>3. Biến thể</div>
//         <div className={currentStep >= 4 ? 'active' : ''}>4. Hình ảnh</div>
//         <div className={currentStep >= 5 ? 'active' : ''}>5. Tồn kho</div>
//       </div>

//       {/* Form Content */}
//       {currentStep === 1 && <ProductInfoForm />}
//       {currentStep === 2 && <AttributesForm />}
//       {currentStep === 3 && <VariantsForm />}
//       {currentStep === 4 && <ImagesForm />}
//       {currentStep === 5 && <InventoryForm />}

//       {/* Navigation */}
//       <div className="wizard-nav">
//         {currentStep > 1 && (
//           <button onClick={() => setCurrentStep(currentStep - 1)}>
//             ← Quay lại
//           </button>
//         )}
//         {currentStep < 5 ? (
//           <button onClick={() => setCurrentStep(currentStep + 1)}>
//             Tiếp theo →
//           </button>
//         ) : (
//           <button onClick={handleSubmit}>
//             Tạo sản phẩm
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };
