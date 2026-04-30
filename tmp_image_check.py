from PIL import Image

paths = [
    'images/A4-COMITE_DE_CUENCA_HIDRICA-HOJA_N°_3160-1-_PASAJE-JURAMENTO-SALADO.png',
    'images/A13-ZONA VII-RIO PARAGUAY.png'
]

for p in paths:
    try:
        with Image.open(p) as im:
            print('FILE', p)
            print('MODE', im.mode)
            if im.mode == 'RGBA':
                alpha = im.getchannel('A')
                print('ALPHA', alpha.getextrema())
            else:
                print('NO ALPHA')
    except Exception as e:
        print('ERROR', p, e)
