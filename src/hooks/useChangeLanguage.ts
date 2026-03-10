import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export const useChangeLanguage = () => {
  const { i18n } = useTranslation()

  const changeLanguage = useCallback((lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
    document.documentElement.lang = lang
  }, [i18n])

  return changeLanguage
}
