import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../supabaseClient'
import { getTranhInOptions } from '../../services/tranhInService.js'
import { getVanOptions } from '../../services/vanService.js'
import { getGiayBoOptions } from '../../services/giayBoService.js'
import { getGlassMicaOptions } from '../../services/glassMicaService.js'

export function useQuoteMaterials() {
  const [dbMaterialsList, setDbMaterialsList] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase.from('material').select('*')
        if (!error && data) setDbMaterialsList(data)
      } catch (err) {
        console.error('Lỗi lấy bảng material:', err)
      }
    }
    load()
  }, [])

  const dynamicTranhInOptions = useMemo(() => getTranhInOptions(dbMaterialsList), [dbMaterialsList])
  const dynamicVanOptions = useMemo(() => getVanOptions(dbMaterialsList), [dbMaterialsList])
  const dynamicGiayBoOptions = useMemo(() => getGiayBoOptions(dbMaterialsList), [dbMaterialsList])
  const dynamicGlassMicaOptions = useMemo(() => getGlassMicaOptions(dbMaterialsList), [dbMaterialsList])

  return {
    dbMaterialsList,
    dynamicTranhInOptions,
    dynamicVanOptions,
    dynamicGiayBoOptions,
    dynamicGlassMicaOptions,
  }
}
