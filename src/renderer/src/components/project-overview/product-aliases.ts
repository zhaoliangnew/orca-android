// leniu: Chinese product names for repo folders, defaults from each product's app_name.
export const DEFAULT_PRODUCT_ALIASES: Readonly<Record<string, string>> = {
  app_add_food: '加菜机',
  app_ai_cheng: '智能秤',
  app_ai_cheng_new: '智能秤(新)',
  app_ai_hnswlib_demo: '货品识别示例',
  app_all_out_food: '批量出品机',
  app_bind: '取盘机',
  app_bind_alipay: '取盘机(支付宝)',
  app_cheng: '智能秤(旧)',
  app_dining_cabinet: '取餐柜',
  app_dinner_write: '餐具写入器',
  app_factory: '添加设备工具',
  app_food_safe_gateway: '食安网关',
  app_food_safe_guard_alarm: '食安报警器',
  app_fresh_cabinet: '生鲜柜',
  app_kitchen_gateway: '厨房网关',
  app_out_food: '出品机',
  app_price_tag: '价签',
  app_print_gateway: '打印网关',
  app_rice_army: '米面柜',
  app_sdk_demo: 'SDK 测试',
  app_sdk_demo_third: '开放 Demo',
  app_self_device: '自助机',
  app_self_ordering: '自助点餐',
  app_super: '智慧收银',
  'framwork2.0': '公共框架',
  leniu_face: '人脸库',
  leniu_face_3288: '人脸库 3288',
  'leniu-k12-gua-android': '智慧收银 K12'
}

/** User overrides win; an empty override means "show the folder name only". */
export function productAlias(
  folderName: string,
  overrides: Readonly<Record<string, string>> | undefined
): string | undefined {
  const override = overrides?.[folderName]
  if (override !== undefined) {
    return override.trim() || undefined
  }
  return DEFAULT_PRODUCT_ALIASES[folderName]
}

export function productFolderName(path: string): string {
  return (
    path
      .replace(/[\\/]+$/, '')
      .split(/[\\/]/)
      .pop() ?? path
  )
}
