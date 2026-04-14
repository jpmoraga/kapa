// app/onboarding/_copy.ts

export const onboardingCopy = {
    document: {
      title: "Documento de identidad",
      subtitle:
        "Sube frente y reverso de tu documento. Guardamos las imágenes como respaldo y, si la lectura local funciona, prellenamos algunos datos para que los confirmes.",
      cardUploadTitle: "Documento de identidad",
      cardUploadHintEmpty:
        "Selecciona una imagen (JPG/PNG). La imagen se guardará como respaldo.",
      prefillLoading: "Intentando prellenar…",
      prefillReady: "Prellenado listo ✅ (reintentar)",
      prefillAction: "Intentar prellenado opcional",
      detectedTitle: "Datos para confirmar",
      detectedHint:
        "El prellenado es opcional. Si falla, puedes completar o corregir los campos manualmente.",
      manualHintLocked:
        "Sube frente y reverso para habilitar la edición manual.",
      manualHintPrefilled:
        "Revisa el prellenado automático y corrige cualquier dato antes de continuar.",
      manualHintOptional:
        "El prellenado es opcional. Puedes completar o corregir los campos manualmente.",
      btnContinue: "Continuar",
      btnBack: "Volver",
      needFile: "Sube una foto para continuar.",
      needScan: "El prellenado no es obligatorio para continuar.",
    },
  
    personal: {
      title: "Datos personales",
      titlePhoneOnly: "Confirma tu teléfono",
      subtitle: "Completa tu nombre, RUT y teléfono para operar.",
      subtitlePhoneOnly: "Solo necesitamos confirmar tu teléfono para continuar.",
      phoneLabel: "Teléfono",
      phonePlaceholder: "+56 9 1234 5678",
      badge:
        "Siguiente paso: datos bancarios.",
      btnBack: "Volver",
      btnContinue: "Continuar",
    },
  
    bank: {
      title: "Datos bancarios",
      subtitle: "Usaremos estos datos para gestionar abonos y retiros a una cuenta a tu nombre.",
      bankLabel: "Banco",
      bankPlaceholder: "Selecciona un banco",
      typeLabel: "Tipo de cuenta",
      typePlaceholder: "Selecciona tipo de cuenta",
      numberLabel: "Número de cuenta",
      numberPlaceholder: "Ej: 12345678",
      note: "Debe ser una cuenta cuyo titular coincida con el RUT de tu perfil.",
      btnBack: "Volver",
      btnContinue: "Continuar",
      btnContinueDisabled: "Completa banco, tipo y número con datos válidos",
    },
  
    terms: {
      title: "Términos y condiciones",
      subtitle: "Para operar en la plataforma debes aceptar los términos.",
      scrollHint: "Desliza hasta el final para habilitar “Aceptar términos”.",
      btnAccept: "Aceptar términos",
      btnBack: "Volver",
      saving: "Guardando...",
      defaultError: "No se pudo aceptar términos",
      networkError: "Error de red",
      intro:
        "Estos términos regulan el uso de la plataforma Kapa21. Al aceptar, confirmas que leíste y entiendes lo siguiente:",
      bullets: [
        "Definiciones: “Kapa21” es la plataforma que administra operaciones de compra/venta y flujos de tesorería del usuario.",
        "Alcance del servicio: Kapa21 facilita la ejecución de operaciones según disponibilidad.",
        "No custodia / terceros: Kapa21 no mantiene custodia directa de tus fondos; utiliza terceros, custodios o exchanges.",
        "Elegibilidad y verificación: podremos solicitar verificación de identidad y otros datos para operar.",
        "Depósitos y retiros: los depósitos en CLP se validan manualmente con comprobantes; pueden ser rechazados si hay inconsistencias.",
        "Riesgos: precios pueden variar, existe volatilidad y riesgos de mercado que asume el usuario.",
        "Disponibilidad: el servicio puede presentar demoras por validaciones, horarios bancarios o dependencias de terceros.",
        "Comisiones: se informan antes de confirmar cada operación.",
        "Privacidad y datos personales: usamos tus datos para operar y cumplir validaciones necesarias.",
        "Limitación de responsabilidad: Kapa21 no responde por pérdidas derivadas de mercado o fallas de terceros, en la medida permitida por ley.",
        "Suspensión/cierre: podremos suspender o cerrar cuentas ante uso indebido, incumplimiento o requerimientos legales.",
        "Ley aplicable y contacto: se rige por la ley chilena. Contacto: contacto@kapa21.cl.",
      ],
    },
  } as const;
